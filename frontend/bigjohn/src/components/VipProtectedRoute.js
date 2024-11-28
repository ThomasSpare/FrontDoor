import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";

const VipProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();
  console.log("VipProtectedRoute rendered", { isAuthenticated, isLoading });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Redirect to home page if not authenticated, not back to /vip
  return isAuthenticated ? children : <Navigate to="/" />;
};

export default VipProtectedRoute;
