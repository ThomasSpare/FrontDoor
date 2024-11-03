import React, { useState, useEffect } from "react";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/audio.css";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultAudioLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import { Box, IconButton, Typography, Card, CardContent } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";
import { convertFromRaw } from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import { useAuth0 } from "@auth0/auth0-react";

const VipArea = () => {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [posts, setPosts] = useState([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    fetchVipContent();
  }, [isAuthenticated, getAccessTokenSilently]);

  const fetchVipContent = async () => {
    try {
      let response;
      if (isAuthenticated) {
        const token = await getAccessTokenSilently();
        response = await axios.get("http://localhost:8080/api/vip", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        response = await axios.get("http://localhost:8080/api/vip");
      }
      const sortedPosts = response.data.sort(
        (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
      );
      setPosts(sortedPosts);
    } catch (error) {
      console.error("Error fetching VIP content:", error);
    }
  };

  const handleNextAudio = () => {
    setCurrentAudioIndex((prevIndex) =>
      prevIndex === posts.filter((post) => post.mediaUrl.audioUrl).length - 1
        ? 0
        : prevIndex + 1
    );
  };

  const handlePreviousAudio = () => {
    setCurrentAudioIndex((prevIndex) =>
      prevIndex === 0
        ? posts.filter((post) => post.mediaUrl.audioUrl).length - 1
        : prevIndex - 1
    );
  };

  const handleNextVideo = () => {
    setCurrentVideoIndex((prevIndex) =>
      prevIndex === posts.filter((post) => post.mediaUrl.videoUrl).length - 1
        ? 0
        : prevIndex + 1
    );
  };

  const handlePreviousVideo = () => {
    setCurrentVideoIndex((prevIndex) =>
      prevIndex === 0
        ? posts.filter((post) => post.mediaUrl.videoUrl).length - 1
        : prevIndex - 1
    );
  };

  const renderContent = (rawContent) => {
    try {
      const contentState = convertFromRaw(JSON.parse(rawContent));
      return stateToHTML(contentState);
    } catch (error) {
      console.error("Failed to parse content:", error);
      return "<p>Invalid content</p>";
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div>
      <h1>VIP Area</h1>
      {posts.map((post) => (
        <Card key={post._id} sx={{ marginBottom: 2 }}>
          <CardContent>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {formatDate(post.uploadDate)}
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom>
              {post.title}
            </Typography>
            {post.description && (
              <div
                dangerouslySetInnerHTML={{
                  __html: renderContent(post.description),
                }}
              />
            )}
            {post.mediaUrl.imageUrl && (
              <img
                src={post.mediaUrl.imageUrl}
                alt={post.title}
                style={{ width: "100%" }}
              />
            )}
            {post.mediaUrl.audioUrl && (
              <div>
                <MediaPlayer title={post.title} src={post.mediaUrl.audioUrl}>
                  <MediaProvider />
                  <DefaultAudioLayout icons={defaultLayoutIcons} />
                </MediaPlayer>
                <Box display="flex" justifyContent="center" mt={2}>
                  <IconButton onClick={handlePreviousAudio}>
                    <ArrowBackIcon />
                  </IconButton>
                  <IconButton onClick={handleNextAudio}>
                    <ArrowForwardIcon />
                  </IconButton>
                </Box>
              </div>
            )}
            {post.mediaUrl.videoUrl && (
              <div>
                <MediaPlayer
                  title={post.title}
                  src={post.mediaUrl.videoUrl}
                  controls
                >
                  <MediaProvider />
                </MediaPlayer>
                <Box display="flex" justifyContent="center" mt={2}>
                  <IconButton onClick={handlePreviousVideo}>
                    <ArrowBackIcon />
                  </IconButton>
                  <IconButton onClick={handleNextVideo}>
                    <ArrowForwardIcon />
                  </IconButton>
                </Box>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VipArea;
