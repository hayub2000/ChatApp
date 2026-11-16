import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/Users.js";
import Message from "../models/Message.js";

// userId -> us ke kitne sockets (tabs/devices) connected hain
const onlineCounts = new Map();

export default function registerSocket(io) {
  // Connection se pehle token verify
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error("No token"));
      socket.userId = jwt.verify(token, process.env.JWT_SECRET).id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.userId);

    // Har user ka apna "room": isi se hum us ke saare tabs ko message bhej sakte hain
    socket.join(userId);

    const count = (onlineCounts.get(userId) || 0) + 1;
    onlineCounts.set(userId, count);
    if (count === 1) socket.broadcast.emit("userOnline", userId);
    socket.emit("onlineUsers", [...onlineCounts.keys()]);

    socket.on("sendMessage", async (data, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        const to = String((data && data.to) || "");
        const text = String((data && data.text) || "").trim();

        if (!mongoose.isValidObjectId(to) || to === userId) {
          return reply({ ok: false, message: "Invalid receiver" });
        }
        if (!text || text.length > 2000) {
          return reply({ ok: false, message: "Message khali ya bohat lamba hai" });
        }
        if (!(await User.exists({ _id: to }))) {
          return reply({ ok: false, message: "Receiver nahi mila" });
        }

        // sender hamesha token se, client ke bheje hue data se nahi
        const message = await Message.create({ sender: userId, receiver: to, text });

        io.to(to).emit("newMessage", message);         // receiver ke saare tabs
        socket.to(userId).emit("newMessage", message); // sender ke doosre tabs
        reply({ ok: true, message });                  // sender ke apne tab ko ack
      } catch (err) {
        console.error(err);
        reply({ ok: false, message: "Server error" });
      }
    });

    socket.on("typing", ({ to } = {}) => {
      if (to) io.to(String(to)).emit("typing", { from: userId });
    });

    socket.on("stopTyping", ({ to } = {}) => {
      if (to) io.to(String(to)).emit("stopTyping", { from: userId });
    });

    socket.on("disconnect", () => {
      const left = (onlineCounts.get(userId) || 1) - 1;
      if (left <= 0) {
        onlineCounts.delete(userId);
        socket.broadcast.emit("userOffline", userId);
      } else {
        onlineCounts.set(userId, left);
      }
    });
  });
}