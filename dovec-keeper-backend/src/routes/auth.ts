import { Router } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";

const router = Router();

// Register (for testing - in prod limit this)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User exists" });
    const user = await User.create({ name, email, password, role, department });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "changeme", { expiresIn: "7d" });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        department: user.department || null
      } 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "changeme", { expiresIn: "7d" });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        department: user.department || null
      } 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

export default router;
