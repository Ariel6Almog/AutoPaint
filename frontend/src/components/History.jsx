import { useState, useEffect } from 'react';
import axios from 'axios';

export default function History({ token, onEdit }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const formData = new FormData();
        formData.append("token", token);
        const response = await axios.post("http://127.0.0.1:8000/get-history/", formData);
        setHistoryData(response.data.history);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchHistory();
  }, [token]);

  const handleDownload = (imgData, id) => {
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `autopaint_history_${id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackgroundClick = (e) => {
    if (e.target.id === "modal-background") {
      setSelectedImage(null);
    }
  };

  return (
    <div className="history_screen">
      <h2 className="history_title">Your Painting History</h2>
      
      {loading ? (
        <p className="loading_text">Loading data from server...</p>
      ) : historyData.length === 0 ? (
        <div className="empty_state">
          <div className="empty_icon"></div>
          <h3>No projects found</h3>
          <p>You haven't colorized any manga pages yet.</p>
        </div>
      ) : (
        <div className="history_gallery">
          {historyData.map((item) => (
            <div key={item.id} className="history_card" onClick={() => setSelectedImage(item)}>
              <img src={item.image} alt={`Project ${item.id}`} className="history_card_img" />
              <div className="history_card_info">
                Colorized on: <span className="history_date">{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div 
          id="modal-background"
          onClick={handleBackgroundClick}
          className="modal_backdrop"
        >
          <div className="modal_content">
            
            <div className="modal_actions">
              <button 
                onClick={() => handleDownload(selectedImage.image, selectedImage.id)}
                className="modal_download_btn"
              >
                Download
              </button>
              <button 
                onClick={() => onEdit(selectedImage.image)}
                className="modal_edit_btn"
              >
                Advanced Edit
              </button>
            </div>

            <img 
              src={selectedImage.image} 
              alt="Enlarged Manga" 
              className="modal_img"
            />
          </div>
        </div>
      )}
    </div>
  );
}