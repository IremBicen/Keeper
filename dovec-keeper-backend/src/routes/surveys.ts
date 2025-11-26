import { Router } from "express";
import Survey from "../models/Survey";
import { protect, authorize } from "../middleware/auth";
import { buildSurveyQuery, canUserAccessSurvey } from "../utils/surveyAccess";

const router = Router();

// GET /api/surveys - Get surveys based on role and assignments
router.get("/", protect, async (req: any, res) => {
  try {
    const query = buildSurveyQuery(req.user);
    const surveys = await Survey.find(query).populate("createdBy", "name email");
    res.json(surveys);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch surveys" });
  }
});

// POST /api/surveys - Create survey (admin only)
router.post("/", protect, authorize("admin"), async (req: any, res) => {
  try {
    const survey = await Survey.create({ ...req.body, createdBy: req.user._id });
    res.json(survey);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create survey" });
  }
});

// GET /api/surveys/:id - Get specific survey (if user has access)
router.get("/:id", protect, async (req: any, res) => {
  try {
    const survey = await Survey.findById(req.params.id).populate("createdBy", "name email");
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }
    
    // Check if user can access this survey
    if (!canUserAccessSurvey(survey, req.user)) {
      return res.status(403).json({ message: "You don't have access to this survey" });
    }
    
    res.json(survey);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch survey" });
  }
});

// PUT /api/surveys/:id - Update survey (admin only)
router.put("/:id", protect, authorize("admin"), async (req: any, res) => {
  try {
    const survey = await Survey.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }
    res.json(survey);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update survey" });
  }
});

// DELETE /api/surveys/:id - Delete survey (admin only)
router.delete("/:id", protect, authorize("admin"), async (req: any, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }
    res.json({ message: "Survey deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to delete survey" });
  }
});

export default router;
