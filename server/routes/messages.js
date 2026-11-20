import { Router } from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import auth from "../middleware/auth.js";


const router = Router();

router.get("/:userId",auth, async (req,res)=>{
    try {
        const other = String(req.params.userId);
        if(!mongoose.isValidObjectId(other))
        {
            return res.status(400).json({message:"Invalid user id"})
        }

        const messages = await Message.find({
            $or:[
                {sender: req.userId, receiver: other},
                {sender:other, receiver: req.userId}
            ],
        }).sort({createdAt: -1}).limit(100)
        
        res.json({messages : messages.reverse()})
        

    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Server error"})
    }
})



router.patch("/:userId/read", auth, async (req, res) => {
  try {
    const other = req.params.userId;
    if (!mongoose.isValidObjectId(other)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    await Message.updateMany(
      { sender: other, receiver: req.userId, read: false },
      { $set: { read: true } }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;