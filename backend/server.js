require("dotenv").config(); // Load environment variables
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const mongoose = require("mongoose");
const { ManagementClient } = require("auth0");
const router = express.Router();

const app = express();
const port = process.env.PORT || 10000;

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

// Initialize Auth0 Management Client
const management = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  scope: "read:users",
});

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

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 400 * 1024 * 1024 }, // Set file size limit to 400MB
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

const dailyUserSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  userCount: { type: Number, default: 0 },
  users: [String],
});

const VipContent = mongoose.model("VipContent", vipContentSchema);
const DailyUser = mongoose.model("DailyUser", dailyUserSchema);

app.get("/api/users", async (req, res) => {
  try {
    // First, get an access token
    const tokenResponse = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
      },
      {
        headers: { "content-type": "application/json" },
      }
    );

    // Then use the token to fetch users
    const usersResponse = await axios.get(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users`,
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`,
        },
        params: {
          // Optional parameters to control the request
          page: 0,
          per_page: 50,
          // You can add fields to select specific user attributes
          fields: "email,user_id,name",
        },
      }
    );

    // Extract emails or full user data as needed
    const userEmails = usersResponse.data.map((user) => user.email);

    res.json(userEmails);
  } catch (error) {
    console.error(
      "Error fetching users:",
      error.response ? error.response.data : error
    );
    res.status(500).json({
      message: "Error fetching users",
      errorDetails: error.message,
    });
  }
});

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

// Daily Users Auth0
app.get("/api/dau", async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    const dailyStats = await DailyUser.find({
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: 1 });

    const chartData = dailyStats.map((stat) => ({
      date: stat.date.toISOString().split("T")[0],
      users: stat.userCount,
    }));

    res.json(chartData);
  } catch (error) {
    console.error("Error fetching DAU:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add endpoint to track user activity
app.post("/api/dau/track", async (req, res) => {
  try {
    const { userId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dailyStats = await DailyUser.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!dailyStats) {
      dailyStats = new DailyUser({
        date: today,
        userCount: 0,
        users: [],
      });
    }

    if (!dailyStats.users.includes(userId)) {
      dailyStats.users.push(userId);
      dailyStats.userCount = dailyStats.users.length;
      await dailyStats.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking DAU:", error);
    res.status(500).json({ error: error.message });
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

    const uploadFileToS3 = async (file) => {
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: Date.now().toString() + "-" + file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
      } catch (error) {
        console.error("Error uploading file to S3:", error);
        throw new Error("Error uploading file to S3");
      }
    };

    let imageUrl = null;
    let videoUrl = null;
    let audioUrl = null;

    if (req.files.image) {
      imageUrl = await uploadFileToS3(req.files.image[0]);
    }
    if (req.files.video) {
      videoUrl = await uploadFileToS3(req.files.video[0]);
    }
    if (req.files.audio) {
      audioUrl = await uploadFileToS3(req.files.audio[0]);
    }

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
app.post("/api/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: Date.now().toString() + "-" + req.file.originalname,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    const data = await s3Client.send(command);
    const imageUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    res.status(201).json({ imageUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Error uploading image" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
