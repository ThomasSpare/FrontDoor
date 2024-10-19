const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
require("dotenv").config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Configure Multer to use S3 for storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: "public-read",
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
  }),
});

// Sample news data
let newsPosts = [
  {
    id: 1,
    title: "First News",
    content: "This is the first news content.",
    uploadDate: new Date().toISOString(),
    link: "http://example.com",
  },
  {
    id: 2,
    title: "Second News",
    content: "This is the second news content.",
    uploadDate: new Date().toISOString(),
    link: "http://example.com",
  },
];

// Routes
app.get("/api/news", (req, res) => {
  res.json(newsPosts);
});

app.post("/api/news", (req, res) => {
  const newPost = {
    id: newsPosts.length + 1,
    title: req.body.title,
    content: req.body.content,
    uploadDate: new Date().toISOString(),
    link: req.body.link, // Save the link
  };
  newsPosts.push(newPost);
  res.status(201).json(newPost);
});

app.put("/api/news/:id", (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const postIndex = newsPosts.findIndex((post) => post.id === postId);

  if (postIndex !== -1) {
    newsPosts[postIndex] = {
      ...newsPosts[postIndex],
      title: req.body.title,
      content: req.body.content,
      uploadDate: new Date().toISOString(), // Update the upload date
      link: req.body.link, // Update the link
    };
    res.json(newsPosts[postIndex]);
  } else {
    res.status(404).json({ message: "Post not found" });
  }
});

app.delete("/api/news/:id", (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const postIndex = newsPosts.findIndex((post) => post.id === postId);

  if (postIndex !== -1) {
    const deletedPost = newsPosts.splice(postIndex, 1);
    res.json(deletedPost[0]);
  } else {
    res.status(404).json({ message: "Post not found" });
  }
});

// Image upload route
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.status(201).json({ imageUrl: req.file.location });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
