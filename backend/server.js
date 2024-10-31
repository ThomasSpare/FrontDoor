const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { auth } = require("express-oauth2-jwt-bearer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");
const multerS3 = require("multer-s3");
const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

const app = express();
const port = process.env.PORT || 8080;

const jwtCheck = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256",
});

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Authorization,Content-Type",
  })
);
app.use(bodyParser.json());
app.use(jwtCheck);

// Enable preflight requests for all routes
app.options("*", cors());

// Debugging middleware to log the token
app.use((req, res, next) => {
  console.log("Authorization Header:", req.headers.authorization);
  next();
});

// Routes
app.get("/authorized", function (req, res) {
  res.send("Secured Resource");
});

// Configure AWS SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure Multer to use S3 for storage
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    acl: "public-read",
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
  }),
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define a schema and model for news posts
const newsPostSchema = new mongoose.Schema({
  title: String,
  content: String,
  uploadDate: { type: Date, default: Date.now },
  link: String,
  imageUrl: String,
});

const NewsPost = mongoose.model("NewsPost", newsPostSchema);

// Define a schema and model for Spotify embeds
const spotifyEmbedSchema = new mongoose.Schema({
  embedUrl: String,
});

const SpotifyEmbed = mongoose.model("SpotifyEmbed", spotifyEmbedSchema);

// Routes
app.get("/api/news", async (req, res) => {
  try {
    const newsPosts = await NewsPost.find();
    res.json(newsPosts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching news posts" });
  }
});

app.post("/api/news", async (req, res) => {
  try {
    const newPost = new NewsPost(req.body);
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ message: "Error saving news post" });
  }
});

app.put("/api/news/:id", async (req, res) => {
  try {
    const updatedPost = await NewsPost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: "Error updating news post" });
  }
});

app.delete("/api/news/:id", async (req, res) => {
  try {
    const deletedPost = await NewsPost.findByIdAndDelete(req.params.id);
    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(deletedPost);
  } catch (error) {
    res.status(500).json({ message: "Error deleting news post" });
  }
});

// Spotify embed route
app.get("/api/spotify", async (req, res) => {
  try {
    const spotifyEmbeds = await SpotifyEmbed.find()
      .sort({ uploadDate: -1 })
      .limit(5);
    if (spotifyEmbeds.length === 0) {
      return res.status(200).json({ message: "No Spotify embeds found" });
    }
    res.json(spotifyEmbeds);
  } catch (error) {
    res.status(500).json({ message: "Error fetching Spotify embeds" });
  }
});

app.get("/api/spotify", (req, res) => {
  const embedCode = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/5V1tlGEIQhVIwLYHTdRaFq?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
  res.json({ embedCode });
});

app.delete("/api/spotify/:id", async (req, res) => {
  try {
    const deletedEmbed = await SpotifyEmbed.findByIdAndDelete(req.params.id);
    if (!deletedEmbed) {
      return res.status(404).json({ message: "Embed not found" });
    }
    res.json(deletedEmbed);
  } catch (error) {
    res.status(500).json({ message: "Error deleting Spotify embed" });
  }
});

// Image upload route
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.status(201).json({ imageUrl: req.file.location });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
