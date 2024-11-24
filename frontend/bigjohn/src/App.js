import React, { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import News from "./components/News";
import Banner from "./components/Banner";
import NewsEditor from "./components/NewsEditor";
import ProtectedRoute from "./components/ProtectedRoute";
import VipProtectedRoute from "./components/VipProtectedRoute";
import AuthButtons from "./components/AuthButtons";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/audio.css";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultAudioLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import backgroundImage from "./video/john edit3.png";
import videoUrl from "./video/20241009212703.mp4"; // Import the video file
import { Box, IconButton } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VipArea from "./pages/VipArea";
import "./App.css";

function App() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [spotifyEmbed, setSpotifyEmbed] = useState(null);

  const playlist = [
    { title: "JUMP UP", src: "/assets/YouandIforever-2.mp3" },
    {
      title: "Destiny Killer",
      src: "/assets/Big John - Destiny Killer  Edith.mp3",
    },
    { title: "Song 3", src: "/assets/song3.mp3" },
  ];

  const BackendUrl = process.env.REACT_APP_BACKENDURL;

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  useEffect(() => {
    const fetchSpotifyEmbed = async () => {
      try {
        let response;
        if (isAuthenticated) {
          const token = await getAccessTokenSilently();
          response = await fetch(`${BackendUrl}/api/spotify`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          response = await fetch(`${BackendUrl}/api/spotify`);
        }
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          // Sort the Spotify embeds by uploadDate in descending order
          const sortedData = data.sort(
            (a, b) =>
              new Date(a.uploadDate).getTime() -
              new Date(b.uploadDate).getTime()
          );
          setSpotifyEmbed(sortedData[0]);
        } else {
          console.error("Expected an array but got:", data);
        }
      } catch (error) {
        console.error("Error fetching Spotify embed:", error);
      }
    };

    fetchSpotifyEmbed();
  }, [isAuthenticated, getAccessTokenSilently]);

  const handleNextTrack = () => {
    setCurrentTrackIndex((prevIndex) =>
      prevIndex === playlist.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePreviousTrack = () => {
    setCurrentTrackIndex((prevIndex) =>
      prevIndex === 0 ? playlist.length - 1 : prevIndex - 1
    );
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <MediaPlayer
              title={playlist[currentTrackIndex].title}
              src={playlist[currentTrackIndex].src}
            >
              <MediaProvider />
              <DefaultAudioLayout icons={defaultLayoutIcons} />
            </MediaPlayer>
            <Box display="flex" justifyContent="center" mt={2}>
              <IconButton
                icons={defaultLayoutIcons}
                iconsSize="XL"
                style={{ color: "red" }}
                onClick={handlePreviousTrack}
                disabled={currentTrackIndex === 0}
              >
                <ArrowBackIcon size={32} />
              </IconButton>
              <IconButton
                icons={defaultLayoutIcons}
                iconsSize="XL"
                style={{ color: "red" }}
                onClick={handleNextTrack}
                disabled={currentTrackIndex === playlist.length - 1}
              >
                <ArrowForwardIcon size={32} />
              </IconButton>
            </Box>
            <Banner
              backgroundImage={backgroundImage}
              backgroundVideo={videoUrl}
            />
            <AuthButtons />
            <h1
              style={{
                fontSize: "2rem",
                textAlign: "center",
                marginTop: "0px",
                marginBottom: "4vh",
                color: "aliceblue",
              }}
            >
              Register to get VIP access to unreleased music
            </h1>
            <News />
            {uploadedImageUrl && <img src={uploadedImageUrl} alt="Uploaded" />}
            {spotifyEmbed && (
              <div
                dangerouslySetInnerHTML={{ __html: spotifyEmbed.embedCode }}
              />
            )}
          </>
        }
      />
      <Route
        path="/vip"
        element={
          <VipProtectedRoute>
            <VipArea />
          </VipProtectedRoute>
        }
      />
      <Route
        path="/johns-news"
        element={
          <ProtectedRoute>
            <NewsEditor setUploadedImageUrl={setUploadedImageUrl} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
