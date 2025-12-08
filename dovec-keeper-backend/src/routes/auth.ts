import { Router } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";

const router = Router();

// Register (for testing / tooling only - in production, restrict or remove this endpoint)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, department, departments } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedName = String(name).trim();
    if (!trimmedEmail || !trimmedName) {
      return res
        .status(400)
        .json({ message: "Name and email cannot be empty" });
    }

    const allowedRoles = ["admin", "director", "coordinator", "manager", "employee"];
    const normalizedRole = (role || "employee").toString().toLowerCase();
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const exists = await User.findOne({ email: trimmedEmail });
    if (exists) return res.status(400).json({ message: "User exists" });

    const normalizedDepartments = Array.isArray(departments)
      ? departments.map((d: any) => String(d).trim()).filter(Boolean)
      : [];

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password,
      role: normalizedRole,
      department: department || null,
      departments: normalizedDepartments,
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "changeme", { expiresIn: "7d" });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        department: user.department || null,
        departments: user.departments || []
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
        department: user.department || null,
        departments: user.departments || []
      } 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

export default router;
