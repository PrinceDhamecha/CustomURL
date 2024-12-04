const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();

// MongoDB Schema for storing URLs
const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
});
const Url = mongoose.model("Url", urlSchema);

// Middleware for parsing JSON
app.use(express.json());

// Serve static files (like the HTML file) from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Route to handle URL shortening
app.post("/shorten", async (req, res) => {
  const { originalUrl, customShortUrl } = req.body;

  // Ensure the original URL includes the protocol (http:// or https://)
  let fullUrl = originalUrl.trim();
  if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
    fullUrl = "https://" + fullUrl; // Default to https:// if no protocol is provided
  }

  // Save the custom short URL without full URL prefix
  const newUrl = new Url({
    originalUrl: fullUrl,
    shortUrl: customShortUrl.trim().replace(/\/$/, ""), // Normalize short URL
  });

  // Save to database
  await newUrl.save();

  // Respond with the shortened URL
  res.json({
    shortUrl: `http://localhost:3000/${newUrl.shortUrl}`,
  });
});

// Route to handle redirection based on short URL
app.get("/:shortUrl", async (req, res) => {
  const { shortUrl } = req.params;

  // Find the corresponding original URL from the database
  const url = await Url.findOne({ shortUrl });

  if (url) {
    // Redirect the user to the original URL
    res.redirect(url.originalUrl);
  } else {
    // If no matching short URL is found, return a 404 error
    res.status(404).send("Short URL not found");
  }
});

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost/urlshortener", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(3000, () =>
      console.log("Server running on http://localhost:3000")
    );
  })
  .catch((err) => console.error("Error connecting to MongoDB", err));
