import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [serverResponse, setServerResponse] = useState("")

  //Handle file selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setServerResponse("");
  };


  //handle send to paint button
  const handleUpload = async () => {
    if(!selectedFile){
      alert("Please upload a sketch!");
      return;
    }

    //package data in FormData
    const formData = new FormData();
    formData.append("file",selectedFile);

  try {
      const response = await axios.post("http://127.0.0.1:8000/upload-sketch/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      console.log("Server Response(Success)", response.data);
      setServerResponse(`Success!! Server Response working --> ${response.data.filename}`);
      
    } catch (error) {
      console.error("Error Sending File", error);
      setServerResponse("Error Sending File to Server");
    }
  };
  
  return (
    <div>
      <h1>AutoPaint - Upload Screen</h1>
      <div className='upload_container'>
          <input 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          />
      </div>
      <div className='button_container'>
        <button onClick={handleUpload}>Send To Paint</button>
      </div>
      <br/>
      <div className='serverResponse'>{serverResponse}</div>
    </div>
  );
}

export default App;
