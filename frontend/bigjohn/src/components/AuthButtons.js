import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button, Box } from "@mui/material";

const AuthButtons = () => {
  const { loginWithRedirect, logout, isAuthenticated } = useAuth0();

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
      {!isAuthenticated && (
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={() => loginWithRedirect()}
          >
            Register / Login
          </Button>
        </>
      )}
      {isAuthenticated && (
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={() => logout({ returnTo: window.location.origin })}
          >
            Logout
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => (window.location.href = "/vip")}
          >
            MEMBERS AREA
          </Button>
        </>
      )}
    </Box>
  );
};

export default AuthButtons;
