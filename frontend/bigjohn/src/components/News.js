import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faSpotify,
  faFacebook,
  faXTwitter,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { convertFromRaw } from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import "./News.css";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

function News() {
  const { getAccessTokenSilently } = useAuth0();
  const [spotifyEmbeds, setSpotifyEmbeds] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
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

    fetchSpotifyEmbeds();
  }, [getAccessTokenSilently]);

  useEffect(() => {
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
        console.error("Error fetching news:", error);
      }
    };

    fetchPosts();
  }, [getAccessTokenSilently]);

  const renderContent = (rawContent) => {
    try {
      const contentState = convertFromRaw(JSON.parse(rawContent));
      return stateToHTML(contentState);
    } catch (error) {
      console.error("Failed to parse content:", error);
      return "<p>Invalid content</p>";
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid id="news" item xs={6} md={8}>
        <Typography variant="h1" component="h1" gutterBottom>
          News
        </Typography>
        {posts.map((post) => (
          <Card key={post._id} sx={{ marginBottom: 2 }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                {post.title.toUpperCase()}
              </Typography>
              {post.imageUrl && (
                <img
                  style={{ width: "10vw" }}
                  src={post.imageUrl}
                  alt={post.title}
                />
              )}
              <div
                className="news-content"
                dangerouslySetInnerHTML={{
                  __html: renderContent(post.content),
                }}
              />
              {post.link && (
                <Typography variant="body2" component="p">
                  <a href={post.link} target="_blank" rel="noopener noreferrer">
                    {post.link}
                  </a>
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Grid>
      <Grid id="releases" item xs={6} md={4}>
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          marginLeft={"2vw"}
        >
          <IconButton
            component="a"
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ marginBottom: 1 }}
          >
            <FontAwesomeIcon icon={faInstagram} size="2x" />
          </IconButton>
          <IconButton
            component="a"
            href="https://www.spotify.com"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ marginBottom: 1 }}
          >
            <FontAwesomeIcon icon={faSpotify} size="2x" />
          </IconButton>
          <IconButton
            component="a"
            href="https://www.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ marginBottom: 1 }}
          >
            <FontAwesomeIcon icon={faFacebook} size="2x" />
          </IconButton>
          <IconButton
            component="a"
            href="https://www.x.com"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ marginBottom: 1 }}
          >
            <FontAwesomeIcon icon={faXTwitter} size="2x" />
          </IconButton>
          <IconButton
            component="a"
            href="https://www.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ marginBottom: 1 }}
          >
            <FontAwesomeIcon icon={faYoutube} size="2x" />
          </IconButton>
        </Box>
        <Typography variant="h2" component="h2" gutterBottom>
          Releases
        </Typography>
        {Array.isArray(spotifyEmbeds) &&
          spotifyEmbeds.map((embed) => (
            <div
              key={embed._id}
              dangerouslySetInnerHTML={{ __html: embed.embedUrl }}
            />
          ))}
      </Grid>
    </Grid>
  );
}

export default News;
