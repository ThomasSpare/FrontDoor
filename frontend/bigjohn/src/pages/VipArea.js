import React, { useState, useEffect } from "react";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/audio.css";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultAudioLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import { Button, Box, IconButton } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";

const VipArea = () => {
  const [audioPlaylist, setAudioPlaylist] = useState([]);
  const [videoPlaylist, setVideoPlaylist] = useState([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    fetchVipContent();
  }, []);

  const fetchVipContent = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/vip");
      const audioContent = response.data.filter(
        (content) => content.mediaType === "audio"
      );
      const videoContent = response.data.filter(
        (content) => content.mediaType === "video"
      );
      setAudioPlaylist(audioContent);
      setVideoPlaylist(videoContent);
    } catch (error) {
      console.error("Error fetching VIP content:", error);
    }
  };

  const handleNextAudio = () => {
    setCurrentAudioIndex((prevIndex) =>
      prevIndex === audioPlaylist.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePreviousAudio = () => {
    setCurrentAudioIndex((prevIndex) =>
      prevIndex === 0 ? audioPlaylist.length - 1 : prevIndex - 1
    );
  };

  const handleNextVideo = () => {
    setCurrentVideoIndex((prevIndex) =>
      prevIndex === videoPlaylist.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePreviousVideo = () => {
    setCurrentVideoIndex((prevIndex) =>
      prevIndex === 0 ? videoPlaylist.length - 1 : prevIndex - 1
    );
  };

  return (
    <div>
      <h1>VIP Area</h1>

      <div>
        <h2>Music Player</h2>
        {audioPlaylist.length > 0 && (
          <MediaPlayer
            title={audioPlaylist[currentAudioIndex].title}
            src={audioPlaylist[currentAudioIndex].mediaUrl}
          >
            <MediaProvider />
            <DefaultAudioLayout icons={defaultLayoutIcons} />
          </MediaPlayer>
        )}
        <Box display="flex" justifyContent="center" mt={2}>
          <IconButton onClick={handlePreviousAudio}>
            <ArrowBackIcon />
          </IconButton>
          <IconButton onClick={handleNextAudio}>
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      </div>

      <div>
        <h2>Video Player</h2>
        {videoPlaylist.length > 0 && (
          <MediaPlayer
            title={videoPlaylist[currentVideoIndex].title}
            src={videoPlaylist[currentVideoIndex].mediaUrl}
          >
            <MediaProvider />
            <DefaultAudioLayout icons={defaultLayoutIcons} />
          </MediaPlayer>
        )}
        <Box display="flex" justifyContent="center" mt={2}>
          <IconButton onClick={handlePreviousVideo}>
            <ArrowBackIcon />
          </IconButton>
          <IconButton onClick={handleNextVideo}>
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      </div>
    </div>
  );
};

export default VipArea;
