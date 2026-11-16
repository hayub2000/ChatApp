import {Router} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/Users.js"
import auth from "../middleware/auth.js"



const router = Router();


const makeToken = (id) =>{
   return  jwt.sign({id}, process.env.JWT_SECRET, {expiresIn:"7d"})
}

const publicUser = (u) => ({id:u._id, username: u.username, email: u.email})


router.post("/register", async(req,res)=>{
    try {
        const username = String(req.body.username || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "")
        
        if(username.length < 3)
        {
            return res.status(400).json({message:"Length of username should be of minimum 3 characters"})
        }

        if(!email)
        {
            return res.status(400).json({message:"Invalid email"})
        }

        if(password.length < 6)
        {
            return res.status(400).json({message:"Password length should be of minimum 6 characters"})
        }


        const exists = await User.findOne({$or:[{email}, {username}]});
        if(exists)
        {
            return res.status(409).json({message:"Username or email already exists"})
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const user  = await User.create({username,email,passwordHash})

        return res.status(201).json({token:makeToken(user._id), user:publicUser(user)})

    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Server Error"})
    }
})




router.post("/login",async (req,res)=> {
    try {
        const email = String(req.body.email || "").trim().toLowerCase()
        const password = String(req.body.password || "") 

        const user = await User.findOne({email})

        const validUser = user && (await bcrypt.compare(password, user.passwordHash));

        if(!validUser){
            return res.status(401).json({message:"Invalid email Id or Password"})
        }

        res.json({token: makeToken(user._id), user:publicUser(user)})

    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Server Error"})
    }
})



router.get("/me",auth, async (req,res)=>{
    const user = await User.findById(req.userId)

    if(!user)
    {
        return res.status(404).json({message:"User not found"})
    }

    res.json({user:publicUser(user)})
})




export default router;
