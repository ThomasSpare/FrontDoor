import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faSpotify,
  faXTwitter,
  faYoutube,
  faSoundcloud,
} from "@fortawesome/free-brands-svg-icons";
import { convertFromRaw } from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import {
  Grid2,
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import "./News.css";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

const BackendUrl = process.env.REACT_APP_BACKENDURL;

function News() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [spotifyEmbeds, setSpotifyEmbeds] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchSpotifyEmbeds = async () => {
      try {
        let response;
        if (isAuthenticated) {
          const token = await getAccessTokenSilently();
          response = await axios.get(`${BackendUrl}/api/spotify`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          response = await axios.get(`${BackendUrl}/api/spotify`);
        }
        setSpotifyEmbeds(response.data);
      } catch (error) {
        console.error("Error fetching Spotify embeds:", error);
      }
    };

    fetchSpotifyEmbeds();
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        let response;
        if (isAuthenticated) {
          const token = await getAccessTokenSilently();
          response = await axios.get(`${BackendUrl}/api/news`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          response = await axios.get(`${BackendUrl}/api/news`);
        }
        const sortedPosts = response.data.sort(
          (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
        );
        setPosts(sortedPosts.slice(0, 5));
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    };

    fetchPosts();
  }, [isAuthenticated, getAccessTokenSilently]);

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
    <Grid2 container spacing={4}>
      <Grid2 id="news" item xs={6} md={8}>
        <Typography
          style={{ color: "gray" }}
          variant="h1"
          component="h1"
          gutterBottom
        >
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
                  style={{ width: "33vw", padding: "1vw" }}
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
      </Grid2>
      <Grid2 id="releases" item xs={6} md={4}>
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          marginLeft={"2vw"}
        >
          <IconButton
            component="a"
            href="https://www.instagram.com/bigjohnmuzik/?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ marginBottom: 1 }}
          >
            <FontAwesomeIcon icon={faInstagram} size="2x" />
          </IconButton>
          <IconButton
            component="a"
            href="https://open.spotify.com/artist/7d1omhMKPYbBOTVsqinKte?si=48YSIxKOQkSfN3EhUCeyAg"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ marginBottom: 1 }}
          >
            <FontAwesomeIcon icon={faSpotify} size="2x" />
          </IconButton>
          <IconButton
            component="a"
            href="https://soundcloud.com/big-john-192594714"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ marginBottom: 1 }}
          >
            <FontAwesomeIcon icon={faSoundcloud} size="2x" />
          </IconButton>
          <IconButton
            component="a"
            href="https://www.threads.net/@bigjohnmuzik?xmt=AQGzEI5k2GoyeZuBWXk31jlbLgg_5EUXXbSIAvxJeQpZWc8"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ marginBottom: 1 }}
          >
            <FontAwesomeIcon icon={faXTwitter} size="2x" />
          </IconButton>
          <IconButton
            component="a"
            href="https://www.youtube.com/channel/UC5YeDIhooVYZF3CUieT5dIw"
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
      </Grid2>
    </Grid2>
  );
}

export default News;
