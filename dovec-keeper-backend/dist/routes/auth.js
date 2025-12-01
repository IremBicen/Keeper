"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// Register (for testing - in prod limit this)
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;
        const exists = await User_1.default.findOne({ email });
        if (exists)
            return res.status(400).json({ message: "User exists" });
        const user = await User_1.default.create({ name, email, password, role, department });
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || "changeme", { expiresIn: "7d" });
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
    }
    catch (err) {
        res.status(500).json({ message: "Server error", err });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "Invalid credentials" });
        const isMatch = await user.comparePassword(password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials" });
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || "changeme", { expiresIn: "7d" });
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
    }
    catch (err) {
        res.status(500).json({ message: "Server error", err });
    }
});
exports.default = router;
