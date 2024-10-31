import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App";
import authConfig from "./auth_config.json";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <Auth0Provider
    domain={authConfig.domain}
    clientId={authConfig.clientId}
    redirectUri={window.location.origin}
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: authConfig.audience,
    }}
  >
    <Router>
      <App />
    </Router>
  </Auth0Provider>
);
