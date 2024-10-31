import React, { useState, useEffect } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  convertToRaw,
  convertFromRaw,
  Modifier,
  AtomicBlockUtils,
  CompositeDecorator,
} from "draft-js";
import "draft-js/dist/Draft.css";
import axios from "axios";
import AWS from "aws-sdk";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useAuth0 } from "@auth0/auth0-react";

const findLinkEntities = (contentBlock, callback, contentState) => {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === "LINK"
    );
  }, callback);
};

const Link = (props) => {
  const { url } = props.contentState.getEntity(props.entityKey).getData();
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  );
};

const decorator = new CompositeDecorator([
  {
    strategy: findLinkEntities,
    component: Link,
  },
]);

const NewsEditor = ({ setUploadedImageUrl }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty(decorator)
  );
  const [title, setTitle] = useState("");
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [link, setLink] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState("");
  const [spotifyEmbeds, setSpotifyEmbeds] = useState([]); // Ensure initial state is an array
  const [imageHeadline, setImageHeadline] = useState(""); // State for image headline

  useEffect(() => {
    fetchPosts();
    fetchSpotifyEmbeds();
  }, []);

  const fetchPosts = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get("http://localhost:8080/api/news", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const sortedPosts = response.data.sort(
        (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
      );
      setPosts(sortedPosts.slice(0, 5));
    } catch (error) {
      console.error("Error fetching news posts:", error);
    }
  };

  const fetchSpotifyEmbeds = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get("http://localhost:8080/api/spotify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSpotifyEmbeds(response.data);
    } catch (error) {
      console.error("Error fetching Spotify embeds:", error);
    }
  };

  const handleEditorChange = (state) => {
    setEditorState(state);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleSave = async () => {
    const contentState = editorState.getCurrentContent();
    const rawContent = JSON.stringify(convertToRaw(contentState));
    const postData = {
      title,
      content: rawContent,
      imageUrl: imageUrl, // Include the image URL
      link: link, // Include the link URL
    };

    try {
      const token = await getAccessTokenSilently();
      if (editingPostId) {
        await axios.put(
          `http://localhost:8080/api/news/${editingPostId}`,
          postData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert("News post updated!");
      } else {
        await axios.post("http://localhost:8080/api/news", postData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        alert("News post saved!");
      }
      fetchPosts();
      resetEditor();
    } catch (error) {
      console.error("There was an error saving the news post!", error);
    }
  };

  const handleEdit = (post) => {
    setTitle(post.title);
    setEditorState(
      EditorState.createWithContent(
        convertFromRaw(JSON.parse(post.content)),
        decorator
      )
    );
    setLink(post.link); // Set the link state when editing a post
    setEditingPostId(post._id); // Use _id instead of id
  };

  const handleDelete = async (postId) => {
    try {
      const token = await getAccessTokenSilently();
      await axios.delete(`http://localhost:8080/api/news/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("News post deleted!");
      fetchPosts();
    } catch (error) {
      console.error("There was an error deleting the news post!", error);
    }
  };

  const handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  };

  const toggleInlineStyle = (style) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  const toggleBlockType = (blockType) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  const resetEditor = () => {
    setTitle("");
    setEditorState(EditorState.createEmpty(decorator));
    setLink(""); // Reset the link state
    setEditingPostId(null);
  };

  const promptForLink = () => {
    setLinkDialogOpen(true);
  };

  const confirmLink = () => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      "LINK",
      "MUTABLE",
      { url: link }
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(editorState, {
      currentContent: contentStateWithEntity,
    });
    setEditorState(
      RichUtils.toggleLink(
        newEditorState,
        newEditorState.getSelection(),
        entityKey
      )
    );
    setLinkDialogOpen(false);
    setLink("");
  };

  const promptForImage = () => {
    setImageDialogOpen(true);
  };

  const confirmImage = () => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      "IMAGE",
      "IMMUTABLE",
      { src: imageUrl }
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = AtomicBlockUtils.insertAtomicBlock(
      editorState,
      entityKey,
      " "
    );
    setEditorState(newEditorState);
    setImageDialogOpen(false);
    setImageUrl("");
  };

  const promptForUpload = () => {
    setUploadDialogOpen(true);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const uploadImage = () => {
    if (!selectedFile) return;

    // Configure AWS SDK
    AWS.config.update({
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
      region: process.env.REACT_APP_AWS_REGION,
    });

    const s3 = new AWS.S3();
    const params = {
      Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
      Key: selectedFile.name,
      Body: selectedFile,
    };

    s3.upload(params, (err, data) => {
      if (err) {
        console.error("There was an error uploading the image:", err);
        return;
      }
      setImageUrl(data.Location);
      setUploadDialogOpen(false);
      setSelectedFile(null);
      alert("Image uploaded successfully!");
    });
  };

  const handleSpotifyEmbedChange = (e) => {
    setSpotifyEmbedUrl(e.target.value);
  };

  const saveSpotifyEmbed = async () => {
    try {
      const token = await getAccessTokenSilently();
      await axios.post(
        "http://localhost:8080/api/spotify",
        { embedUrl: spotifyEmbedUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Spotify embed saved!");
      setSpotifyEmbedUrl("");
      fetchSpotifyEmbeds(); // Fetch the updated list of Spotify embeds
    } catch (error) {
      console.error("There was an error saving the Spotify embed!", error);
    }
  };

  const handleSpotifyDelete = async (_id) => {
    try {
      const token = await getAccessTokenSilently();
      await axios.delete(`http://localhost:8080/api/spotify/${_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Spotify embed deleted!");
      fetchSpotifyEmbeds(); // Fetch the updated list of Spotify embeds
    } catch (error) {
      console.error("There was an error deleting the Spotify embed!", error);
    }
  };

  const handleImageHeadlineChange = (e) => {
    setImageHeadline(e.target.value);
  };

  const handleImageFormSubmit = (e) => {
    e.preventDefault();
    uploadImage();
    // Handle the headline as needed, e.g., save it to the backend
    console.log("Image Headline:", imageHeadline);
  };

  return (
    <div className="main-editor-div">
      <h1>News Editor</h1>
      <input
        className="title-input"
        type="text"
        placeholder="Title"
        value={title}
        onChange={handleTitleChange}
      />
      <div className="Editor-main">
        <ButtonGroup
          variant="contained"
          aria-label="outlined primary button group"
        >
          <Button onClick={() => toggleInlineStyle("BOLD")}>Bold</Button>
          <Button onClick={() => toggleInlineStyle("ITALIC")}>Italic</Button>
          <Button onClick={() => toggleInlineStyle("UNDERLINE")}>
            Underline
          </Button>
          <Button onClick={() => toggleBlockType("header-one")}>H1</Button>
          <Button onClick={() => toggleBlockType("header-two")}>H2</Button>
          <Button onClick={() => toggleBlockType("unordered-list-item")}>
            UL
          </Button>
          <Button onClick={() => toggleBlockType("ordered-list-item")}>
            OL
          </Button>
          <Button onClick={() => toggleBlockType("blockquote")}>
            Blockquote
          </Button>
          <Button onClick={promptForLink}>Add Link</Button>
          <Button onClick={promptForImage}>Add Image</Button>
          <Button onClick={promptForUpload}>Upload Image</Button>
          <Button onClick={resetEditor}>Clear</Button>
        </ButtonGroup>
        <div
          className="editor"
          style={{
            border: "1px solid #ccc",
            minHeight: "200px",
            padding: "10px",
          }}
        >
          <Editor
            editorState={editorState}
            handleKeyCommand={handleKeyCommand}
            onChange={handleEditorChange}
          />
        </div>
        <Button variant="contained" color="primary" onClick={handleSave}>
          {editingPostId ? "Update" : "Save"}
        </Button>
      </div>
      <h2>Last 5 News</h2>
      <ul>
        {posts.map((post) => (
          <li key={post._id}>
            <h3>{post.title}</h3>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => handleEdit(post)}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleDelete(post._id)} // Use _id instead of id
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>

      <h2>Spotify Embed</h2>
      <TextField
        label="Spotify Embed URL"
        value={spotifyEmbedUrl}
        onChange={handleSpotifyEmbedChange}
        fullWidth
      />
      <Button variant="contained" color="primary" onClick={saveSpotifyEmbed}>
        Save Spotify Embed
      </Button>

      <h2>Last 5 Spotify Embeds</h2>
      {Array.isArray(spotifyEmbeds) &&
        spotifyEmbeds.map((embed) => (
          <div key={embed._id}>
            <div dangerouslySetInnerHTML={{ __html: embed.embedUrl }} />
            <Button
              color="warning"
              onClick={() => handleSpotifyDelete(embed._id)}
            >
              Delete
            </Button>
          </div>
        ))}

      <h2>Upload Image and Set Headline</h2>
      <form onSubmit={handleImageFormSubmit}>
        <TextField
          label="Image Headline"
          value={imageHeadline}
          onChange={handleImageHeadlineChange}
          fullWidth
        />
        <input type="file" onChange={handleFileChange} />
        <Button type="submit" variant="contained" color="primary">
          Upload Image
        </Button>
      </form>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)}>
        <DialogTitle>Add Link</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="URL"
            type="url"
            fullWidth
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmLink} color="primary">
            Add Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)}>
        <DialogTitle>Add Image</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Image URL"
            type="url"
            fullWidth
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmImage} color="primary">
            Add Image
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
      >
        <DialogTitle>Upload Image</DialogTitle>
        <DialogContent>
          <input type="file" onChange={handleFileChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={uploadImage} color="primary">
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default NewsEditor;
