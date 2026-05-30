from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import cv2
import numpy as np
import base64
import re
import os
import time
import logging
import tensorflow as tf
import traceback

import database, tables, auth
from colorize import load_colorization_model
from speech_mask import load_segmentation_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

tables.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AutoPaint API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
)

logging.info("Initializing AI Models...")
colorization_model = load_colorization_model()
segmentation_model = load_segmentation_model()

try:
    gpu_info = tf.config.experimental.get_memory_info('GPU:0')
    logging.info(f"Initial GPU VRAM usage: {gpu_info['current'] / (1024**2):.2f} MB")
except Exception:
    logging.info("No GPU VRAM info available.")


def img_to_base64(img_array):
    _, buffer = cv2.imencode('.jpg', img_array)
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

def decode_b64(b64_str, is_mask=False):
    if "," in b64_str:
        b64_data = b64_str.split(",")[1]
    else:
        b64_data = b64_str
        
    nparr = np.frombuffer(base64.b64decode(b64_data), np.uint8)
    
    if is_mask:
        return cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
    else:
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)


@app.post("/register")
def register(
    username: str = Form(...), 
    email: str = Form(...), 
    password: str = Form(...), 
    db: Session = Depends(database.get_db)
):
    
    user_exists = db.query(tables.User).filter(
        (tables.User.username == username) | (tables.User.email == email)
    ).first()
    
    if user_exists:
        raise HTTPException(status_code=400, detail="Username or Email already registered")
    
    hashed_pwd = auth.get_password_hash(password)
    new_user = tables.User(username=username, email=email, hashed_password=hashed_pwd)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "message": "User registered successfully"}


@app.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(database.get_db)
):
    # if user writes email instead of username it detects the same row in the DB
    user = db.query(tables.User).filter(tables.User.email == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}



@app.post("/get-speech-mask/")
async def get_speech_mask(image: str = Form(...), token: str = Form(...)):
    start_time = time.time()
    
    #token security
    try:
        auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
    except Exception as e:
        print(f"Auth verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        t_pre = time.time()
        #pre process
        img_bgr = decode_b64(image)
        if img_bgr is None:
            raise ValueError("Failed to decode image from Base64. Data is corrupted.")
            
        h, w = img_bgr.shape[:2]
        
        img_512 = cv2.resize(img_bgr, (512, 512))
        img_rgb = cv2.cvtColor(img_512, cv2.COLOR_BGR2RGB)
        img_normalized = (img_rgb / 127.5) - 1.0
        input_tensor = np.expand_dims(img_normalized, axis=0).astype(np.float32)
        time_pre = time.time() - t_pre
        
        t_inf = time.time()
        #model
        predicted_mask = segmentation_model.predict(input_tensor)
        time_inf = time.time() - t_inf
        
        t_post = time.time()
        #post process
        predicted_mask = predicted_mask.squeeze()
        predicted_mask = (predicted_mask > 0.5).astype(np.uint8) * 255
        
        red_mask = np.zeros((512, 512, 4), dtype=np.uint8)
        red_mask[:, :, 0] = 0
        red_mask[:, :, 1] = 0
        red_mask[:, :, 2] = 255
        red_mask[:, :, 3] = np.where(predicted_mask > 0, 128, 0)
        
        red_mask = cv2.resize(red_mask, (w, h), interpolation=cv2.INTER_NEAREST)
        _, mask_buffer = cv2.imencode('.png', red_mask)
        time_post = time.time() - t_post
        
        total_time = time.time() - start_time
        
        logging.info("=== U-Net Segmentation Profiling ===")
        logging.info(f"Total Latency: {total_time * 1000:.2f} ms")
        
        return {
            "original": img_to_base64(img_bgr), # מחזיר את התמונה המקורית בדיוק כפי שנכנסה
            "mask": f"data:image/png;base64,{base64.b64encode(mask_buffer).decode('utf-8')}"
        }
        
    except Exception as e:
        import traceback
        print("\n=== ERROR IN GET-SPEECH-MASK ===")
        traceback.print_exc() 
        raise HTTPException(status_code=400, detail=str(e))
@app.post("/colorize/")
async def colorize(original_image: str = Form(...), edited_mask: str = Form(...), token: str = Form(...)):
    start_time = time.time()
    
    #token security
    try:
        auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
    except Exception as e:
        print(f"Auth verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        t_pre = time.time()
        #pre process
        img_bgr = decode_b64(original_image)
        mask_rgba = decode_b64(edited_mask, is_mask=True)
        
        h, w = img_bgr.shape[:2]
        
        img_512 = cv2.resize(img_bgr, (512, 512))
        img_rgb = cv2.cvtColor(img_512, cv2.COLOR_BGR2RGB)
        
        img_normalized = (img_rgb / 127.5) - 1.0
        input_tensor = np.expand_dims(img_normalized, axis=0).astype(np.float32)
        time_pre = time.time() - t_pre

        t_inf = time.time()
        #model
        colorized_output_tensor = colorization_model(input_tensor, training=True)
        colorized_output = colorized_output_tensor.numpy() 
        time_inf = time.time() - t_inf
        
        t_post = time.time()
        #post process
        result_img = (colorized_output[0] + 1.0) * 127.5
        result_img = result_img.astype(np.uint8)
        result_bgr = cv2.cvtColor(result_img, cv2.COLOR_RGB2BGR)
        

        final_bgr_pure = cv2.resize(result_bgr, (w, h))

        #add
        final_bgr_masked = final_bgr_pure.copy()
        if mask_rgba is not None and mask_rgba.shape[2] == 4:
            alpha_channel = mask_rgba[:, :, 3] 
            mask_condition = alpha_channel > 0 
            final_bgr_masked[mask_condition] = img_bgr[mask_condition]
            
        time_post = time.time() - t_post
        total_time = time.time() - start_time

        logging.info("CGAN Colorization Profiling")
        logging.info(f"Total Latency: {total_time * 1000:.2f} ms")
        
        return {
            "colorized_pure": img_to_base64(final_bgr_pure),
            "colorized_masked": img_to_base64(final_bgr_masked)
        }
        
    except Exception as e:
        import traceback
        print("\n=== ERROR IN COLORIZATION ===")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/save-history/")
async def save_history(image_data: str = Form(...), token: str = Form(...), db: Session = Depends(database.get_db)):
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username = payload.get("sub")
        user = db.query(tables.User).filter(tables.User.username == username).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        new_item = tables.History(user_id=user.id, image_data=image_data)
        db.add(new_item)
        db.commit()
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/get-history/")
async def get_history(token: str = Form(...), db: Session = Depends(database.get_db)):
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username = payload.get("sub")
        user = db.query(tables.User).filter(tables.User.username == username).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        history_records = db.query(tables.History).filter(tables.History.user_id == user.id).order_by(tables.History.created_at.desc()).all()

        results = [{
            "id": r.id, 
            "image": r.image_data, 
            "date": r.created_at.strftime("%Y-%m-%d %H:%M")
        } for r in history_records]
        
        return {"history": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))