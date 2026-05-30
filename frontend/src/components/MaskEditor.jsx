import { useRef, useState, useEffect } from 'react';

export default function MaskEditor({ originalImage, initialMask, onApprove, onBack }) {
  const maskCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("brush");
  const [brushSize, setBrushSize] = useState(20);
  const [showMask, setShowMask] = useState(true);

  useEffect(() => {
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.src = originalImage;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (initialMask) {
        const maskImg = new Image();
        maskImg.src = initialMask;
        maskImg.onload = () => {
          ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
        };
      }
    };
  }, [originalImage, initialMask]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      maskCanvasRef.current.getContext('2d').beginPath();
    }
  };

  const getMousePos = (canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getMousePos(canvas, e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";

    if (tool === "brush") {
      ctx.strokeStyle = "red"; 
      ctx.globalCompositeOperation = "source-over";
    } else {
      ctx.globalCompositeOperation = "destination-out"; 
    }

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handleApprove = () => {
    const finalMaskDataUrl = maskCanvasRef.current.toDataURL("image/png");
    onApprove(finalMaskDataUrl);
  };

  return (
    <div className="mask_wizard">
      <h3 className="mask_title">Edit Speech Bubbles Mask</h3>
      
      <div className="toolbar mask_toolbar">
        <button className={`toolbar_btn ${tool === 'brush' ? 'active' : ''}`} onClick={() => setTool('brush')}>Brush</button>
        <button className={`toolbar_btn ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')}>Eraser</button>
        
        <div className="brush_size_control">
          <label>Size: {brushSize}</label>
          <input 
            type="range" 
            min="5" max="100" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
          />
        </div>

        <button className="toolbar_btn" onClick={() => setShowMask(!showMask)}>
          {showMask ? "Hide Mask" : "Show Mask"}
        </button>
      </div>
      
      <div className="canvas_container">
        <img 
          src={originalImage} 
          alt="Original" 
          className="mask_original_img"
        />
        
        <canvas 
          ref={maskCanvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseLeave={stopDrawing}
          className={`mask_overlay_canvas ${showMask ? 'mask_visible' : 'mask_hidden'} ${tool === 'brush' ? 'tool_brush' : 'tool_eraser'}`}
        />
      </div>

      <div className="mask_action_buttons">
        <button className="mask_back_btn" onClick={onBack}>Back</button>
        <button className="mask_approve_btn" onClick={handleApprove}>Colorize</button>
      </div>
    </div>
  );
}