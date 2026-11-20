import "dotenv/config";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";
import registerSocket from "./socket/index.js";
import conversationRoutes from "./routes/conversations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_ORIGIN = "http://localhost:5173"; // Vite ka default port

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // sirf testing ke liye

app.get("/", (req, res) => res.send("Chat API is running"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT_ORIGIN } });
registerSocket(io);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const port = process.env.PORT || 5000;
    server.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => console.error("DB connection failed:", err.message));