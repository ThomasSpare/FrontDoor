import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import NewsEditor from "./NewsEditor";

describe("NewsEditor Component", () => {
  test("renders NewsEditor component", () => {
    render(<NewsEditor />);
    expect(screen.getByText(/News Editor/i)).toBeInTheDocument();
  });

  test("updates title input", () => {
    render(<NewsEditor />);
    const titleInput = screen.getByPlaceholderText(/Title/i);
    fireEvent.change(titleInput, { target: { value: "Test Title" } });
    expect(titleInput.value).toBe("Test Title");
  });

  test("updates editor state on change", () => {
    render(<NewsEditor />);
    const editorDiv = screen.getByRole("textbox");
    fireEvent.input(editorDiv, { target: { textContent: "Test Content" } });
    expect(editorDiv.textContent).toBe("Test Content");
  });

  test("triggers save function on save button click", () => {
    render(<NewsEditor />);
    const saveButton = screen.getByText(/Save/i);
    fireEvent.click(saveButton);
    expect(screen.getByText(/News post saved!/i)).toBeInTheDocument();
  });

  test("opens and adds link correctly", () => {
    render(<NewsEditor />);
    const addLinkButton = screen.getByText(/Add Link/i);
    fireEvent.click(addLinkButton);
    const linkInput = screen.getByLabelText(/URL/i);
    fireEvent.change(linkInput, { target: { value: "http://example.com" } });
    const addLinkDialogButton = screen.getByText(/Add Link/i);
    fireEvent.click(addLinkDialogButton);
    expect(screen.queryByLabelText(/URL/i)).not.toBeInTheDocument();
  });

  test("opens and adds image correctly", () => {
    render(<NewsEditor />);
    const addImageButton = screen.getByText(/Add Image/i);
    fireEvent.click(addImageButton);
    const imageInput = screen.getByLabelText(/Image URL/i);
    fireEvent.change(imageInput, {
      target: { value: "http://example.com/image.jpg" },
    });
    const addImageDialogButton = screen.getByText(/Add Image/i);
    fireEvent.click(addImageDialogButton);
    expect(screen.queryByLabelText(/Image URL/i)).not.toBeInTheDocument();
  });

  test("opens and uploads image correctly", () => {
    render(<NewsEditor />);
    const uploadImageButton = screen.getByText(/Upload Image/i);
    fireEvent.click(uploadImageButton);
    const fileInput = screen.getByLabelText(/Upload Image/i);
    const file = new File(["dummy content"], "example.png", {
      type: "image/png",
    });
    fireEvent.change(fileInput, { target: { files: [file] } });
    const uploadDialogButton = screen.getByText(/Upload/i);
    fireEvent.click(uploadDialogButton);
    expect(screen.queryByLabelText(/Upload Image/i)).not.toBeInTheDocument();
  });
});
