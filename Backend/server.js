require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const {
  blobServiceClient,
  containerName,
  createContainerIfNotExists,
  deleteUserFolder,
} = require("./azureStorage");
const mongoose = require("mongoose");
const User = require("./Models/users");
const {
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_KEY;

const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey,
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

app.post("/generate-upload-url", async (req, res) => {
  try {
    const { fileType, fileSize } = req.body;

    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: "Invalid file type" });
    }

    if (fileSize > 2 * 1024 * 1024) {
      return res.status(400).json({ error: "File too large" });
    }

    const { userId } = req.body;

    const fileName = `${userId}/profile.jpg`;

    const containerClient = blobServiceClient.getContainerClient(containerName);

    const blobClient = containerClient.getBlockBlobClient(fileName);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: fileName,
        permissions: BlobSASPermissions.parse("cw"),
        expiresOn: new Date(Date.now() + 10 * 60 * 1000),
      },
      sharedKeyCredential,
    ).toString();

    const uploadUrl = `${blobClient.url}?${sasToken}`;

    res.json({
      uploadUrl,
      fileName,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, profileImage } = req.body;
    const newUser = new User({ name, email, profileImage });
    await newUser.save();
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find();

    res.json(users);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/hello", (req, res) => {
  res.json({ message: "Welcome to the backend server!" });
});

app.delete("/users/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    await deleteUserFolder(email);
    await User.findOneAndDelete({ email });

    res.json({ message: "User and associated images deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

const PORT = 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, async () => {
      await createContainerIfNotExists().catch((err) => {
        console.error("Error creating container:", err);
      });
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
