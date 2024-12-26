import React from "react";
import "./StyledButton.css";

const StyledButton = ({ onClick, children, color }) => {
  return (
    <a
      className="button"
      href="#"
      style={{ "--color": color }}
      onClick={onClick}
    >
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      {children}
    </a>
  );
};

export default StyledButton;
