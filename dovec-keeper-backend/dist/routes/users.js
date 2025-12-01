"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/users - Get users (admin sees all, manager sees only their department)
router.get("/", auth_1.protect, async (req, res) => {
    try {
        let query = {};
        const forEvaluation = req.query.forEvaluation === 'true';
        // Managers can only see users in their department
        if (req.user.role === "manager") {
            if (!req.user.department) {
                return res.status(403).json({
                    message: "Manager must have a department assigned to view users"
                });
            }
            query.department = req.user.department;
        }
        else if (req.user.role === "employee" && forEvaluation) {
            // Employees can fetch users for evaluation purposes
            // Return users in the same department (for teammates) and all managers
            query = {
                $or: [
                    { department: req.user.department, role: { $in: ["employee", "manager"] } }, // Teammates
                    { role: "manager" } // All managers
                ]
            };
        }
        else if (req.user.role !== "admin") {
            // Regular users cannot see other users unless for evaluation
            return res.status(403).json({ message: "Access denied" });
        }
        const users = await User_1.default.find(query).select("-password");
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: error.message || "Failed to fetch users" });
    }
});
// GET /api/users/:id - Get specific user (if user has access)
router.get("/:id", auth_1.protect, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Managers can only see users in their department
        if (req.user.role === "manager") {
            if (user.department !== req.user.department) {
                return res.status(403).json({ message: "Access denied" });
            }
        }
        else if (req.user.role !== "admin") {
            // Regular users can only see themselves
            const userIdStr = String(user._id);
            const reqUserIdStr = String(req.user._id);
            if (userIdStr !== reqUserIdStr) {
                return res.status(403).json({ message: "Access denied" });
            }
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: error.message || "Failed to fetch user" });
    }
});
// PUT /api/users/:id - Update user (admin only)
router.put("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const { name, email, role, department, kpi } = req.body;
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (email !== undefined)
            updateData.email = email;
        if (role !== undefined)
            updateData.role = role;
        if (department !== undefined)
            updateData.department = department;
        if (kpi !== undefined)
            updateData.kpi = kpi; // Allow KPI update
        const user = await User_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        res.status(400).json({ message: error.message || "Failed to update user" });
    }
});
exports.default = router;
