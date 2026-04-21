const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const app = express();

// 🔥 IMPORTANT: correct static paths
app.use("/sender", express.static(path.join(__dirname, "sender")));
app.use("/receiver", express.static(path.join(__dirname, "receiver")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const server = http.createServer(app);
const io = new Server(server);

const upload = multer({ dest: "uploads/" });

// 📷 Upload API
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const input = req.file.path;
    const t = Date.now();

    const original = `uploads/original-${t}.jpg`;
    const compressed = `uploads/compressed-${t}.jpg`;

    await sharp(input).jpeg({ quality: 100 }).toFile(original);
    await sharp(input).jpeg({ quality: 40 }).toFile(compressed);

    const origSize = fs.statSync(original).size;
    const compSize = fs.statSync(compressed).size;

    console.log("\n📊 IMAGE LOG");
    console.log("Original:", (origSize/1024).toFixed(1), "KB");
    console.log("Compressed:", (compSize/1024).toFixed(1), "KB");

    fs.unlinkSync(input);

    res.json({ imageUrl: "/" + original });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// 💬 SOCKET FIXED
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg); // 🔥 IMPORTANT FIX
  });

  socket.on("image message", (data) => {
    io.emit("image message", data); // 🔥 IMPORTANT FIX
  });
});

server.listen(6000, () => {
  console.log("✅ WORKING → http://localhost:6000/sender");
});