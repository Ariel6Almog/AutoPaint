from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="AutoPaint API", description="Backend for Manga Colorization")
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["http://localhost:5173"],
    allow_credentials = True,
    allow_headers = ["*"],
    allow_methods = ["*"],
)

@app.get("/")
def read_root():
    return {"status": "success", "message": "AutoPaint Server is Running!"}

#path to get sketch
@app.post("/upload-sketch/")
async def upload_sketch(file: UploadFile = File(...)):
   
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "message": "Sketch received successfully and is ready for AI processing!"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)