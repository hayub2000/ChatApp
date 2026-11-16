import { Router } from "express";
import Users from "../models/Users.js";
import auth from "../middleware/auth.js";


const router  = Router();

router.get("/", auth, async (req,res) =>{

    try {
        const search = String(req.body.search || "").trim();
        const filter = {_id: {$ne: req.userId}}
    
        if (search) {
          const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // regex ke special chars escape
          filter.username = { $regex: safe, $options: "i" };
        }
    
        const users = await Users.find(filter).select("username email").limit(20)
        res.json({users});

        
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server error" });
    }

})


export default router;