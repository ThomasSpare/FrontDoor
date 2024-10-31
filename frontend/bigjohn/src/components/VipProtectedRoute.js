import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";

const VipProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth0();

  return isAuthenticated ? children : <Navigate to="/vip" />;
};

export default VipProtectedRoute;
