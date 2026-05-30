import { useState } from 'react';
import axios from 'axios';

export default function Auth({ setToken }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [authData, setAuthData] = useState({ username: "", email: "", password: "" });
  const [validationError, setValidationError] = useState("");

  const handleAuthInput = (e) => {
    setAuthData({ ...authData, [e.target.name]: e.target.value });
    setValidationError("");
  };

  const validateInputs = () => {
    const { username, email, password } = authData;

    //email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError("Email is invalid.");
      return false;
    }

    // register check list
    if (isRegistering) {
      //username 
      const usernameRegex = /^[a-zA-Z0-9]{4,14}$/;
      if (!usernameRegex.test(username)) {
        setValidationError("Your password must contain between 4-14 characters, no special characters");
        return false;
      }

      //password
      const hasLetters = /[a-zA-Z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const isCorrectLength = password.length >= 9 && password.length <= 15;

      if (!isCorrectLength) {
        setValidationError("Your password must contain between 9-15 characters.");
        return false;
      }
      else if (!hasLetters) {
        setValidationError("Your password must contain letters.");
        return false;
      }
      else if (!hasNumbers) {
        setValidationError("Your password has to contain numbers.");
        return false;
      }
    } else {
      if (!password) {
        setValidationError("Please enter a password.");
        return false;
      }
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateInputs()) return;

    const formData = new FormData();
    formData.append("username", authData.username);
    formData.append("email", authData.email);
    formData.append("password", authData.password);

    try {
      await axios.post("http://127.0.0.1:8000/register", formData);
      alert("Registered successfully, you may login!");
      setIsRegistering(false);
      setValidationError("");
    } catch (error) {
      alert("Registeration Failed" + (error.response?.data?.detail || "Registration failed"));
    }
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    const formData = new FormData();
    formData.append("username", authData.email);
    formData.append("password", authData.password);

    try {
      const response = await axios.post("http://127.0.0.1:8000/token", formData);
      setToken(response.data.access_token);
      setValidationError("");
    } catch (error) {
      alert("Login failed, try again!");
    }
  };

  return (
    <div className="auth_container">
      <h2>{isRegistering ? "Create an Account" : "Got an account? Login"}</h2>
      <div className="auth_form">
        
        {isRegistering && (
          <input 
            name="username" 
            placeholder="Username" 
            onChange={handleAuthInput} 
            value={authData.username}
          />
        )}
        
        <input 
          name="email" 
          placeholder="Email" 
          onChange={handleAuthInput} 
          value={authData.email}
        />
        
        <input 
          name="password" 
          type="password" 
          placeholder="password" 
          onChange={handleAuthInput} 
          value={authData.password}
        />
        
        {validationError && (
          <div className="validation_error_msg">
             {validationError}
          </div>
        )}
        
        <button className="auth_btn" onClick={isRegistering ? handleRegister : handleLogin}>
          {isRegistering ? "Register" : "Login"}
        </button>
        
        <p 
          className="auth_toggle_link" 
          onClick={() => {
            setIsRegistering(!isRegistering);
            setValidationError("");
          }}
        >
          {isRegistering ? "To Login" : "Create an Account Here"}
        </p>
      </div>
    </div>
  );
}