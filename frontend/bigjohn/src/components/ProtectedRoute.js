import React, { useState } from "react";
import NewsEditor from "./NewsEditor"; // Ensure correct import
import "./ProtectedRoute.css";

const ProtectedRoute = ({ element: Component, ...rest }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleLogin = () => {
    if (password === process.env.REACT_APP_PROTECTED_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  return isAuthenticated ? (
    <NewsEditor {...rest} />
  ) : (
    <div className="password_div">
      <h2>Password Protected</h2>
      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={handlePasswordChange}
      />
      <button onClick={handleLogin} style={{ width: "16vw", marginTop: "2vh" }}>
        Login
      </button>
    </div>
  );
};

export default ProtectedRoute;
