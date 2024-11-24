import React, { useState } from "react";
import "./ProtectedRoute.css";

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if already authenticated in session storage
    return sessionStorage.getItem("isNewsEditorAuthenticated") === "true";
  });
  const [password, setPassword] = useState("");
  console.log("ProtectedRoute rendered", { isAuthenticated });

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleLogin = () => {
    if (password === process.env.REACT_APP_PROTECTED_PASSWORD) {
      setIsAuthenticated(true);
      // Store authentication state in session storage
      sessionStorage.setItem("isNewsEditorAuthenticated", "true");
    } else {
      alert("Incorrect password");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="password_div">
      <h2>Password Protected</h2>
      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={handlePasswordChange}
        onKeyPress={handleKeyPress}
        autoFocus
      />
      <button onClick={handleLogin} style={{ width: "16vw", marginTop: "2vh" }}>
        Login
      </button>
    </div>
  );
};

export default ProtectedRoute;
