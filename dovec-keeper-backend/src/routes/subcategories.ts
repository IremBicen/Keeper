import { Router } from "express";
import Subcategory from "../models/Subcategory";
import Category from "../models/Category";
import { protect, authorize } from "../middleware/auth";

const router = Router();

// GET all subcategories (with category populated)
router.get("/", protect, async (req, res) => {
  try {
    const subcategories = await Subcategory.find().populate("category", "name");
    res.json(subcategories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET subcategories by category ID
router.get("/category/:categoryId", protect, async (req, res) => {
  try {
    const subcategories = await Subcategory.find({
      category: req.params.categoryId
    }).populate("category", "name");
    res.json(subcategories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new subcategory
router.post("/", protect, authorize("admin"), async (req, res) => {
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
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subcategory = await Subcategory.create({
      name: name.trim(),
      minRating,
      maxRating,
      category
    });

    await subcategory.populate("category", "name");
    res.status(201).json(subcategory);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update subcategory
router.put("/:id", protect, authorize("admin"), async (req, res) => {
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

    const subcategory = await Subcategory.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(minRating !== undefined && { minRating }),
        ...(maxRating !== undefined && { maxRating })
      },
      { new: true }
    ).populate("category", "name");

    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    res.json(subcategory);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE subcategory
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    res.json({ message: "Subcategory deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

