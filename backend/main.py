from fastapi import FastAPI, File, UploadFile
import uvicorn

app = FastAPI(title="AutoPaint API", description="Backend for Manga Colorization")

@app.get("/")
def read_root():
    return {"status": "success", "message": "AutoPaint Server is Running!"}

# הנתיב החדש שלנו לקבלת הסקיצה
@app.post("/upload-sketch/")
async def upload_sketch(file: UploadFile = File(...)):
    # כאן בעתיד נשמור את התמונה ונשלח אותה למודל ה-AI לצביעה
    # כרגע, נחלץ את שם הקובץ וסוגו, ונחזיר אישור שקיבלנו אותו בהצלחה
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "message": "Sketch received successfully and is ready for AI processing!"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)