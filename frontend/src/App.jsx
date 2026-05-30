import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Workspace from './components/Workspace';
import History from './components/History';
import './App.css';

function App() {

  //check if token exist
  const getInitialToken = () => {
    const saved = localStorage.getItem("userToken");
    if (!saved || saved === "null" || saved === "undefined" || saved === "") {
      return null;
    }
    return saved;
  };

  const [token, setToken] = useState(getInitialToken());
  const [currentView, setCurrentView] = useState("workspace"); 
  const [editImageData, setEditImageData] = useState(null); 

  //update token state to browser
  useEffect(() => {
    if (token && token !== "null") {
      localStorage.setItem("userToken", token);
    } else {
      localStorage.removeItem("userToken");
    }
  }, [token]);


  //Logout
  const handleLogout = () => {
    localStorage.removeItem("userToken");
    setToken(null); 
    setCurrentView("workspace");
    setEditImageData(null);
  };

 //token guard - if there is no token redirect to auth screen
  if (!token) {
    return <Auth setToken={setToken} />;
  }

  //UI
  return (
    <div className="app_container">
      <header className="main_header">
        <h1>AutoPaint AI</h1>
        <div className="header_actions">
          <button className="nav_btn" onClick={() => { setCurrentView("workspace"); setEditImageData(null); }}>New Paint</button>
          <button className="nav_btn" onClick={() => setCurrentView("history")}>History</button>
          <button className="logout_btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {currentView === "workspace" ? (
        <Workspace 
          token={token} 
          setToken={setToken} 
          editImageData={editImageData} 
          clearEditImage={() => setEditImageData(null)} 
        />
      ) : (
        <History 
          token={token} 
          onEdit={(imgData) => {
            setEditImageData(imgData); 
            setCurrentView("workspace"); 
          }}
        />
      )}
    </div>
  );
}

export default App;