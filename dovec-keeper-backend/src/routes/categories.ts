import { Router } from "express";
import Category from "../models/Category";
import { protect, authorize } from "../middleware/auth";

const router = Router();

// GET /api/categories - Get all categories (all authenticated users can view)
router.get("/", protect, async (req, res) => {
  try {
    const cats = await Category.find();
    res.json(cats);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch categories" });
  }
});

// POST /api/categories - Create category (admin only)
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.json(cat);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create category" });
  }
});

// PUT /api/categories/:id - Update category (admin only)
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(cat);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update category" });
  }
});

// DELETE /api/categories/:id - Delete category (admin only)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to delete category" });
  }
});

export default router;
