import { Router } from "express";
import Survey from "../models/Survey";
import ResponseModel from "../models/Response";
import { protect, authorize } from "../middleware/auth";
import { buildSurveyQuery, canUserAccessSurvey } from "../utils/surveyAccess";

const router = Router();

// GET /api/surveys - Get surveys based on role and assignments
router.get("/", protect, async (req: any, res) => {
  try {
    const query = buildSurveyQuery(req.user);
    // Use lean() so we can safely spread and add computed properties like "responses"
    const surveys = await Survey.find(query)
      .populate("createdBy", "name email")
      .lean();

    // Attach submitted response count for each survey.
    // - Admin: total submitted responses for that survey (all users)
    // - Non-admin: only responses submitted by the current user
    //   * Self/keeper/general → where employee === current user
    //   * Manager/teammate    → where evaluator === current user
    const surveysWithCounts = await Promise.all(
      surveys.map(async (survey: any) => {
        const baseFilter: any = {
          survey: survey._id,
          status: "submitted",
        };

        const title = (survey.title || survey.surveyName || "")
          .toString()
          .toLowerCase();
        const isTeammateForm = title.includes("takım arkadaşı");
        const isManagerForm = title.includes("yönetici");

        // For admins, show global response count per survey
        if (req.user.role === "admin") {
          const adminCount = await ResponseModel.countDocuments(baseFilter);
          return { ...survey, responses: adminCount };
        }

        const userId = req.user._id;

        const filter = { ...baseFilter };
        if (isTeammateForm || isManagerForm) {
          // For manager/teammate forms, count evaluations filled by this user
          (filter as any).evaluator = userId;
        } else {
          // For self/keeper/general forms, count self-responses
          (filter as any).employee = userId;
        }

        const userCount = await ResponseModel.countDocuments(filter);
        return { ...survey, responses: userCount };
      })
    );

    res.json(surveysWithCounts);
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
