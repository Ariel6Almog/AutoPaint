import { useState, useEffect } from 'react';
import axios from 'axios';
import UploadStep from './UploadStep';
import MaskEditor from './MaskEditor';
import ResultScreen from './ResultScreen';

export default function Workspace({ token, setToken, editImageData, clearEditImage }) {
  const [step, setStep] = useState(1); 
  const [originalImage, setOriginalImage] = useState(null);
  const [aiMask, setAiMask] = useState(null); 
  const [finalImageObj, setFinalImageObj] = useState(null); 
  const [isColorizing, setIsColorizing] = useState(false);

  //check if there it's an edit\new paint
  useEffect(() => {
    if (editImageData) {
      setFinalImageObj({ pure: editImageData, masked: editImageData });//set both photos to the history 
      setStep(3);
    }
  }, [editImageData]);

  
  const handleColorize = async (editedMask) => {
    setIsColorizing(true);
    const formData = new FormData();
    formData.append("original_image", originalImage);
    formData.append("edited_mask", editedMask);
    formData.append("token", token);

    try {
      const response = await axios.post("http://127.0.0.1:8000/colorize/", formData);
      const pure = response.data.colorized_pure;
      const masked = response.data.colorized_masked;
      
      setFinalImageObj({ pure, masked });
      setStep(3);

      const historyForm = new FormData();
      historyForm.append("image_data", masked);
      historyForm.append("token", token);
      axios.post("http://127.0.0.1:8000/save-history/", historyForm)
        .catch(err => console.error("Failed to save to history", err));

    } catch (error) {
      if (error.response && error.response.status === 401) {
        setToken(null);
      } else {
        alert("Error Colorizing...");
      }
    } finally {
      setIsColorizing(false);
    }
  };

  return (
    <div className="workspace_container">
      <div className="stepper">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>Upload Sketch</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>Edit Mask</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>Result</div>
      </div>
      
      {step === 1 && (
        <UploadStep token={token} onUploadSuccess={(original, mask) => { setOriginalImage(original); setAiMask(mask); setStep(2); }} onAuthError={() => setToken(null)} />
      )}

      {step === 2 && (
        <div className="mask_editor_wrapper">
          {isColorizing && (
            <div className="loading_overlay">⏳ המודל צובע את התמונה...</div>
          )}
          <MaskEditor originalImage={originalImage} initialMask={aiMask} onApprove={handleColorize} onBack={() => setStep(1)} />
        </div>
      )}

      {step === 3 && (
        <ResultScreen 
          finalImageObj={finalImageObj} 
          onReset={() => {
            setOriginalImage(null);
            setAiMask(null);
            setFinalImageObj(null);
            setStep(1);
            if (clearEditImage) clearEditImage();
          }}
        />
      )}
    </div>
  );
}