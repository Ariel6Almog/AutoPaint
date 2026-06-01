import cv2
import os
import numpy as np
from glob import glob

CURRENT_SCRIPT_PATH = "D:\Final Project - Ort College\Model Data\archive\manga_dataset\test"

RAW_DIR = os.path.join(CURRENT_SCRIPT_PATH, "color")
PROCESSED_DIR = os.path.join(CURRENT_SCRIPT_PATH, "processed")
IMG_SIZE = 512

def create_sketch(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    inv = 255 - gray
    blur = cv2.GaussianBlur(inv, (21, 21), 0)
    sketch = cv2.divide(gray, 255 - blur, scale=256)
    return sketch

def process_images():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    
    image_path = glob(os.path.join(RAW_DIR, "*.*"))
    print(f"Found {len(image_path)} images. Starting process...")
    
    for i, path in enumerate(image_path):
        try:
            img = cv2.imread(path)
            if img is None: 
                continue
            
            img_resize = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
            sketch = create_sketch(img_resize)
            
            sketch_3ch = cv2.cvtColor(sketch, cv2.COLOR_GRAY2BGR)
            
            combined = np.hstack((sketch_3ch, img_resize))
            save_path = os.path.join(PROCESSED_DIR, f"pair{i}.png")
            cv2.imwrite(save_path, combined)
            
        except Exception as e:
            print(f"Error processing {path}: {e}")
            
    print("Process Complete for all -raw data-")

if __name__ == "__main__":
    process_images()