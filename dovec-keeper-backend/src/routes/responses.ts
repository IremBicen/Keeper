import { Router } from "express";
import ResponseModel from "../models/Response";
import User from "../models/User";
import { protect } from "../middleware/auth";

const router = Router();

// Helper to determine if a survey is a "yönetici" (manager) evaluation form
const isManagerSurvey = (survey: any): boolean => {
  if (!survey) return false;
  const title = (survey.title || survey.surveyName || "").toLowerCase();
  return title.includes("yönetici");
};

// Role ranking for hierarchy checks (higher number = higher level)
const roleRank: Record<string, number> = {
  employee: 1,
  manager: 2,
  coordinator: 3,
  director: 4,
  admin: 99,
};

// Check if current user can submit a yönetici survey for the target employee
const canSubmitManagerSurveyFor = (currentUser: any, targetEmployee: any): boolean => {
  // Admin can always submit
  if (currentUser.role === "admin") return true;

  const currentRole = (currentUser.role || "").toLowerCase();
  const targetRole = (targetEmployee.role || "").toLowerCase();

  const currentRank = roleRank[currentRole];
  const targetRank = roleRank[targetRole];

  // Unknown roles – be safe and deny
  if (!currentRank || !targetRank) return false;

  // Must be in the same department if department is defined
  if (
    currentUser.department &&
    targetEmployee.department &&
    currentUser.department !== targetEmployee.department
  ) {
    return false;
  }

  // Director cannot evaluate if there is no superior role above them
  if (currentRole === "director") {
    // No role above director except admin – business rule: director has no superior
    return false;
  }

  // Main rule: can only evaluate decisive roles beyond their own (strictly higher role)
  // Example chain: employee -> manager -> coordinator -> director
  return targetRank > currentRank;
};

router.post("/submit", protect, async (req: any, res) => {
  try {
    // save as draft or submit
    const { survey, employee, answers, status } = req.body;

    // If this is a yönetici (manager) survey and user is not admin,
    // enforce role-based permission checks
    const surveyDoc = await ResponseModel.db
      .model("Survey")
      .findById(survey)
      .select("title surveyName");

    if (surveyDoc && isManagerSurvey(surveyDoc)) {
      const targetEmployee = await User.findById(employee).select("role department");
      if (!targetEmployee) {
        return res.status(400).json({ message: "Target employee not found" });
      }

      if (!canSubmitManagerSurveyFor(req.user, targetEmployee)) {
        return res.status(403).json({
          message:
            "You are not allowed to submit this manager evaluation. You can only evaluate your superior in the hierarchy.",
        });
      }
    }

    const existing = await ResponseModel.findOne({ survey, employee });
    if (existing) {
      existing.answers = answers;
      existing.status = status || existing.status;
      if (status === "submitted") existing.submittedAt = new Date();
      await existing.save();
      return res.json(existing);
    }
    const created = await ResponseModel.create({ survey, employee, answers, status });
    res.json(created);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to submit response" });
  }
});

router.get("/", protect, async (req, res) => {
  const list = await ResponseModel.find().populate("employee").populate("survey");
  res.json(list);
});

// GET /api/responses/:surveyId/:employeeId - Get specific response with answers
router.get("/:surveyId/:employeeId", protect, async (req: any, res) => {
  try {
    const { surveyId, employeeId } = req.params;

    const response = await ResponseModel.findOne({
      survey: surveyId,
      employee: employeeId,
    })
      .populate("survey", "title surveyName categories startDate endDate")
      .populate("employee", "name email department");

    if (!response) {
      return res.status(404).json({ message: "Response not found" });
    }

    // Only admins can see detailed results of "yönetici" (manager) forms
    const survey: any = response.survey;
    const isManagerForm = isManagerSurvey(survey);

    if (isManagerForm && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can view results of manager surveys" });
    }

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch response" });
  }
});

export default router;
