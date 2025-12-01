"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Category_1 = __importDefault(require("../models/Category"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/categories - Get all categories (all authenticated users can view)
router.get("/", auth_1.protect, async (req, res) => {
    try {
        const cats = await Category_1.default.find();
        res.json(cats);
    }
    catch (error) {
        res.status(500).json({ message: error.message || "Failed to fetch categories" });
    }
});
// POST /api/categories - Create category (admin only)
router.post("/", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const cat = await Category_1.default.create(req.body);
        res.json(cat);
    }
    catch (error) {
        res.status(400).json({ message: error.message || "Failed to create category" });
    }
});
// PUT /api/categories/:id - Update category (admin only)
router.put("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const cat = await Category_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!cat) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.json(cat);
    }
    catch (error) {
        res.status(400).json({ message: error.message || "Failed to update category" });
    }
});
// DELETE /api/categories/:id - Delete category (admin only)
router.delete("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const cat = await Category_1.default.findByIdAndDelete(req.params.id);
        if (!cat) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.json({ message: "Category deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error.message || "Failed to delete category" });
    }
});
exports.default = router;
