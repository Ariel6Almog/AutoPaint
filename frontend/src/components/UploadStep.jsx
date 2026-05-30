import { useState } from 'react';
import axios from 'axios';

export default function UploadStep({ token, onUploadSuccess, onAuthError }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a sketch first!");
      return;
    }

    setLoading(true);

   //converting file to text
    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onloadend = async () => {
      const base64data = reader.result;

      const formData = new FormData();
      formData.append("image", base64data); 
      formData.append("token", token);

      try {
        const response = await axios.post("http://127.0.0.1:8000/get-speech-mask/", formData);

        if (response.data.original && response.data.mask) {
          onUploadSuccess(response.data.original, response.data.mask);
        } else {
          alert("Error: " + response.data.error);
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          onAuthError(); 
        } else {
          console.error("Upload error:", error.response || error);
          alert("Failed to analyze the sketch. Check backend connection.");
        }
      } finally {
        setLoading(false);
      }
    };
  };

  return (
    <div className="upload_step_container">
      <h2>Step 1: Upload Manga Sketch</h2>
      <p>Upload a black & white sketch to detect speech bubbles automatically.</p>
      
      <input 
        type="file" 
        accept="image/*" 
        className="upload_input"
        onChange={(e) => setSelectedFile(e.target.files[0])} 
      />
      
      <button 
        className={`upload_btn ${loading ? 'loading' : ''}`}
        onClick={handleUpload} 
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Upload & Mask Bubbles"}
      </button>
    </div>
  );
}