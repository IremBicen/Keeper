"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Subcategory_1 = __importDefault(require("../models/Subcategory"));
const Category_1 = __importDefault(require("../models/Category"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET all subcategories (with category populated)
router.get("/", auth_1.protect, async (req, res) => {
    try {
        const subcategories = await Subcategory_1.default.find().populate("category", "name");
        res.json(subcategories);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// GET subcategories by category ID
router.get("/category/:categoryId", auth_1.protect, async (req, res) => {
    try {
        const subcategories = await Subcategory_1.default.find({
            category: req.params.categoryId
        }).populate("category", "name");
        res.json(subcategories);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// POST create new subcategory
router.post("/", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const { name, minRating, maxRating, category } = req.body;
        // Validation
        if (!name || minRating === undefined || maxRating === undefined || !category) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (minRating > maxRating) {
            return res.status(400).json({ message: "Max rating cannot be less than min rating" });
        }
        if (minRating === maxRating) {
            return res.status(400).json({ message: "Min and Max ratings cannot be equal" });
        }
        // Verify category exists
        const categoryExists = await Category_1.default.findById(category);
        if (!categoryExists) {
            return res.status(404).json({ message: "Category not found" });
        }
        const subcategory = await Subcategory_1.default.create({
            name: name.trim(),
            minRating,
            maxRating,
            category
        });
        await subcategory.populate("category", "name");
        res.status(201).json(subcategory);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// PUT update subcategory
router.put("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const { name, minRating, maxRating } = req.body;
        // Validation
        if (minRating !== undefined && maxRating !== undefined) {
            if (minRating > maxRating) {
                return res.status(400).json({ message: "Max rating cannot be less than min rating" });
            }
            if (minRating === maxRating) {
                return res.status(400).json({ message: "Min and Max ratings cannot be equal" });
            }
        }
        const subcategory = await Subcategory_1.default.findByIdAndUpdate(req.params.id, {
            ...(name && { name: name.trim() }),
            ...(minRating !== undefined && { minRating }),
            ...(maxRating !== undefined && { maxRating })
        }, { new: true }).populate("category", "name");
        if (!subcategory) {
            return res.status(404).json({ message: "Subcategory not found" });
        }
        res.json(subcategory);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// DELETE subcategory
router.delete("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const subcategory = await Subcategory_1.default.findByIdAndDelete(req.params.id);
        if (!subcategory) {
            return res.status(404).json({ message: "Subcategory not found" });
        }
        res.json({ message: "Subcategory deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.default = router;
