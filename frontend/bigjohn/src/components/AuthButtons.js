import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Box } from "@mui/material";
import StyledButton from "./StyledButton";

const AuthButtons = () => {
  const { loginWithRedirect, logout, isAuthenticated } = useAuth0();

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-evenly"
      marginTop="10px"
      mt={4}
    >
      {!isAuthenticated && (
        <>
          <StyledButton onClick={() => loginWithRedirect()} color="#1e9bff">
            Register / Login
          </StyledButton>
        </>
      )}
      {isAuthenticated && (
        <>
          <StyledButton
            onClick={() => logout({ returnTo: window.location.origin })}
            color="#ff1867"
          >
            Logout
          </StyledButton>
          <StyledButton
            onClick={() => (window.location.href = "/vip")}
            color="#6eff3e"
          >
            MEMBERS AREA
          </StyledButton>
        </>
      )}
    </Box>
  );
};

export default AuthButtons;
