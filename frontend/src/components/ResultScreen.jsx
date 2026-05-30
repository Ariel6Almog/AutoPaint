import { useState } from 'react';

export default function ResultScreen({ finalImageObj, onReset }) {
  const [filter, setFilter] = useState("normal");
  const [useSegmentation, setUseSegmentation] = useState(true); //on-off mask

  const currentActiveImage = useSegmentation ? finalImageObj.masked : finalImageObj.pure;

  const filtersCSS = {
    normal: "none",
    night: "brightness(0.7) contrast(1.2) contrast(1.1) hue-rotate(180deg)",
    warm: "sepia(0.4) saturate(1.5) brightness(1.1)" 
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentActiveImage;
    link.download = `autopaint_${useSegmentation ? 'protected' : 'pure'}_${filter}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="result_screen">
      <h2 className="result_title">Image Is Ready - Final Step!</h2>
      
      <div className="result_layout">
        
        <div className="filters_panel">
          
          <div className="segmentation_toggle_container">
            <h3>Speech Bubble Masking</h3>
            <label className="toggle_label">
              <input 
                type="checkbox" 
                checked={useSegmentation} 
                onChange={(e) => setUseSegmentation(e.target.checked)}
                className="toggle_checkbox"
              />
              <span>{useSegmentation ? "On" : "Off"}</span>
            </label>
          </div>

          <h3>Filters</h3>
          <div className="filters_list">
            <button className={`filter_btn ${filter === 'normal' ? 'active' : ''}`} onClick={() => setFilter('normal')}>Original</button>
            <button className={`filter_btn ${filter === 'night' ? 'active' : ''}`} onClick={() => setFilter('night')}>Night Mode</button>
            <button className={`filter_btn ${filter === 'warm' ? 'active' : ''}`} onClick={() => setFilter('warm')}>Light Mode</button>
          </div>
          
          <div className="export_actions">
            <button className="download_btn" onClick={handleDownload}>Download Final Image</button>
            <button className="reset_btn" onClick={onReset}>New Paint</button>
          </div>
        </div>

        <div className="image_display">
          <img 
            src={currentActiveImage} 
            alt="Colorized Output" 
            className="result_img"
            style={{ filter: filtersCSS[filter] }}
          />
        </div>
      </div>
    </div>
  );
}