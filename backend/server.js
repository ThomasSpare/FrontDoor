const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");
const multerS3 = require("multer-s3");
const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

const app = express();
const port = process.env.PORT || 10000;
const currentDir = __dirname;
const buildPath = path.resolve(__dirname, "build");

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Replace with your frontend URL
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: "Authorization,Content-Type",
  })
);
app.use(bodyParser.json());

// Function to get access token from Auth0
const getAccessToken = async () => {
  try {
    const response = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: process.env.AUTH0_AUDIENCE,
        grant_type: "client_credentials",
      },
      {
        headers: { "content-type": "application/json" },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Error obtaining access token:", error);
    throw new Error("Error obtaining access token");
  }
};

// Middleware to check JWT token
const jwtCheck = async (req, res, next) => {
  try {
    const token = await getAccessToken();
    req.headers.authorization = `Bearer ${token}`;
    next();
  } catch (error) {
    console.error("Error in jwtCheck middleware:", error);
    res.status(500).json({ message: "Error obtaining access token" });
  }
};

app.use(jwtCheck);

// Enable preflight requests for all routes
app.options("*", cors());

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
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
  }),
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

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

// Define a schema and model for VIP content
const vipContentSchema = new mongoose.Schema({
  title: String,
  description: String,
  mediaUrl: {
    imageUrl: String,
    videoUrl: String,
    audioUrl: String,
  },
  mediaType: String, // 'image', 'audio', 'video', 'mixed'
  uploadDate: { type: Date, default: Date.now },
});

const VipContent = mongoose.model("VipContent", vipContentSchema);

// API Routes
app.get("/api/news", async (req, res) => {
  try {
    const newsPosts = await NewsPost.find();
    res.json(newsPosts);
  } catch (error) {
    console.error("Error fetching news posts:", error);
    res.status(500).json({ message: "Error fetching news posts" });
  }
});

app.post("/api/news", async (req, res) => {
  try {
    const newPost = new NewsPost(req.body);
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error saving news post:", error);
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
    console.error("Error updating news post:", error);
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
    console.error("Error deleting news post:", error);
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
    console.error("Error fetching Spotify embeds:", error);
    res.status(500).json({ message: "Error fetching Spotify embeds" });
  }
});

app.post("/api/spotify", async (req, res) => {
  try {
    const newEmbed = new SpotifyEmbed(req.body);
    await newEmbed.save();
    res.status(201).json(newEmbed);
  } catch (error) {
    console.error("Error saving Spotify embed:", error);
    res.status(500).json({ message: "Error saving Spotify embed" });
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
    console.error("Error deleting Spotify embed:", error);
    res.status(500).json({ message: "Error deleting Spotify embed" });
  }
});

// VIP content routes
app.get("/api/vip", async (req, res) => {
  try {
    const vipContent = await VipContent.find();
    res.json(vipContent);
  } catch (error) {
    console.error("Error fetching VIP content:", error);
    res.status(500).json({ message: "Error fetching VIP content" });
  }
});

app.delete("/api/vip/:id", async (req, res) => {
  try {
    const deletedVipContent = await VipContent.findByIdAndDelete(req.params.id);
    if (!deletedVipContent) {
      return res.status(404).json({ message: "VIP content not found" });
    }
    res.json(deletedVipContent);
  } catch (error) {
    console.error("Error deleting VIP content:", error);
    res.status(500).json({ message: "Error deleting VIP content" });
  }
});

app.post(
  "/api/vip",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    const { title, description } = req.body;
    const imageUrl = req.files.image ? req.files.image[0].location : null;
    const videoUrl = req.files.video ? req.files.video[0].location : null;
    const audioUrl = req.files.audio ? req.files.audio[0].location : null;

    const vipContent = new VipContent({
      title,
      description,
      mediaUrl: { imageUrl, videoUrl, audioUrl },
      mediaType: "mixed",
    });

    try {
      await vipContent.save();
      res.status(201).json(vipContent);
    } catch (error) {
      console.error("Error saving VIP content:", error);
      res.status(500).json({ message: "Error saving VIP content" });
    }
  }
);

// Image upload route
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.status(201).json({ imageUrl: req.file.location });
});

// Serve static files from the React app
app.use(express.static(buildPath));

console.log("Current directory:", currentDir);
console.log("Looking for build at:", buildPath);

// Check if build directory exists
if (!fs.existsSync(buildPath)) {
  console.error(`Build directory not found at: ${buildPath}`);
}

// The "catchall" handler
app.get("*", (req, res) => {
  const indexPath = path.join(buildPath, "index.html");

  if (!fs.existsSync(indexPath)) {
    console.error(`index.html not found at: ${indexPath}`);
    return res
      .status(404)
      .send(`Build files not found. Looked in: ${indexPath}`);
  }

  res.sendFile(indexPath);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
