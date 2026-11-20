import { Router } from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/Users.js";
import auth from "../middleware/auth.js";

const router = Router();

router.get("/", auth, async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(req.userId);

    const rows = await Message.aggregate([
      { $match: { $or: [{ sender: me }, { receiver: me }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          // doosra banda: agar sender main hoon to receiver, warna sender
          _id: { $cond: [{ $eq: ["$sender", me] }, "$receiver", "$sender"] },
          lastMessage: { $first: "$$ROOT" },
          unread: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$receiver", me] }, { $eq: ["$read", false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    const users = await User.find({ _id: { $in: rows.map((r) => r._id) } }).select("username email");
    const byId = new Map(users.map((u) => [String(u._id), u]));

    const conversations = rows
      .filter((r) => byId.has(String(r._id)))
      .map((r) => ({
        user: byId.get(String(r._id)),
        lastMessage: {
          text: r.lastMessage.text,
          sender: r.lastMessage.sender,
          createdAt: r.lastMessage.createdAt,
        },
        unread: r.unread,
      }));

    res.json({ conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;