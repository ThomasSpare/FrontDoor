import React, { useState } from "react";
import NewsEditor from "./NewsEditor"; // Ensure correct import

const ProtectedRoute = ({ element: Component, ...rest }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleLogin = () => {
    if (password === "BigJohn") {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  return isAuthenticated ? (
    <NewsEditor {...rest} />
  ) : (
    <div>
      <h2>Password Protected</h2>
      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={handlePasswordChange}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default ProtectedRoute;
