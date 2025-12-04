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

// Helper: get normalized list of departments for a user (supports multi-department roles)
const getUserDepartments = (user: any): string[] => {
  if (!user) return [];
  const single = (user.department || "").toString().trim();
  const multi = Array.isArray(user.departments) ? user.departments : [];
  const all = [...multi, single]
    .map((d) => d && d.toString().trim())
    .filter(Boolean);
  return Array.from(new Set(all));
};

// Check if current user can submit a yönetici survey for the target employee
const canSubmitManagerSurveyFor = (currentUser: any, targetEmployee: any): boolean => {
  // Admin can always submit
  if (currentUser.role === "admin") return true;

  const currentRole = (currentUser.role || "").toLowerCase();
  const targetRole = (targetEmployee.role || "").toLowerCase();

  // Must share at least one department if departments are defined
  const currentDepartments = getUserDepartments(currentUser);
  const targetDepartments = getUserDepartments(targetEmployee);
  if (currentDepartments.length && targetDepartments.length) {
    const hasOverlap = currentDepartments.some((dept) =>
      targetDepartments.includes(dept)
    );
    if (!hasOverlap) {
      return false;
    }
  }

  // Role-based rules:
  // - Employee -> only manager
  // - Manager -> director or coordinator
  // - Coordinator -> director
  // - Director -> cannot evaluate (no superior)
  if (currentRole === "employee") {
    return targetRole === "manager";
  }

  if (currentRole === "manager") {
    return targetRole === "coordinator" || targetRole === "director";
  }

  if (currentRole === "coordinator") {
    return targetRole === "director";
  }

  // Directors (and any other unknown roles) cannot evaluate
  return false;
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
      const targetEmployee = await User.findById(employee).select(
        "role department departments"
      );
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
