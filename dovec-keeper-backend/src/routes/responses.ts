import { Router } from "express";
import ResponseModel from "../models/Response";
import User from "../models/User";
import { protect } from "../middleware/auth";
import { getUserDepartments } from "../utils/roles";

const router = Router();

// Helper to determine if a survey is a "yönetici" (manager) evaluation form
const isManagerSurvey = (survey: any): boolean => {
  if (!survey) return false;
  const title = (survey.title || survey.surveyName || "").toLowerCase();
  return title.includes("yönetici");
};

// Check if current user can submit a yönetici survey for the target employee
const canSubmitManagerSurveyFor = async (
  currentUser: any,
  targetEmployee: any
): Promise<boolean> => {
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
  // - Employee:
  //     * if there is at least one manager in their departments -> can only evaluate manager
  //     * else if there is coordinator -> can evaluate coordinator
  //     * else if there is director -> can evaluate director
  // - Manager -> director or coordinator
  // - Coordinator -> director
  // - Director -> cannot evaluate (no superior)
  if (currentRole === "employee") {
    const depts = currentDepartments;
    if (!depts.length) return false;

    const deptMatch = {
      $or: [{ department: { $in: depts } }, { departments: { $in: depts } }],
    };

    const hasManager = await User.exists({ role: "manager", ...deptMatch });
    if (hasManager) {
      return targetRole === "manager";
    }

    const hasCoordinator = await User.exists({
      role: "coordinator",
      ...deptMatch,
    });
    if (hasCoordinator) {
      return targetRole === "coordinator";
    }

    const hasDirector = await User.exists({ role: "director", ...deptMatch });
    if (hasDirector) {
      return targetRole === "director";
    }

    // No superior role defined in these departments
    return false;
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

    const isManagerForm = surveyDoc && isManagerSurvey(surveyDoc);

    if (surveyDoc && isManagerForm) {
      const targetEmployee = await User.findById(employee).select(
        "role department departments"
      );
      if (!targetEmployee) {
        return res.status(400).json({ message: "Target employee not found" });
      }

      if (!(await canSubmitManagerSurveyFor(req.user, targetEmployee))) {
        return res.status(403).json({
          message:
            "You are not allowed to submit this manager evaluation. You can only evaluate your superior in the hierarchy.",
        });
      }
    }

    // Uniqueness rules:
    // - Self surveys (keeper, etc.): at most one response per (survey, employee/self)
    // - Manager + teammate surveys: at most one response per (survey, employee target, evaluator)
    let existingQuery: any = { survey, employee };

    if (surveyDoc && isManagerForm) {
      // Manager (yönetici) surveys → one per evaluator + target
      existingQuery.evaluator = req.user._id;
    } else {
      // For non-manager surveys, we keep legacy behavior:
      // one response per (survey, employee/self). Old records without evaluator
      // will still be matched by this.
    }

    const existing = await ResponseModel.findOne(existingQuery);
  if (existing) {
      // If already submitted, do not allow further changes or resubmission
      if (existing.status === "submitted") {
        return res
          .status(400)
          .json({
            message:
              "This survey has already been submitted and cannot be changed.",
          });
      }

      // Ensure evaluator is set for legacy draft responses
      if (!existing.evaluator) {
        existing.evaluator = req.user._id;
      }

      // Allow editing drafts or submitting them once
    existing.answers = answers;
    existing.status = status || existing.status;
    if (status === "submitted") existing.submittedAt = new Date();
    await existing.save();
    return res.json(existing);
  }

    const created = await ResponseModel.create({
      survey,
      employee,
      evaluator: req.user._id,
      answers,
      status,
    });
  res.json(created);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to submit response" });
  }
});

router.get("/", protect, async (req: any, res) => {
  try {
    let query: any = {};

    // Admins can see all responses for checks/results.
    // Non-admins can only see responses where they are involved:
    //  - employee (self/keeper/general)
    //  - evaluator (they filled a manager/teammate form)
    if (req.user.role !== "admin") {
      const userId = req.user._id;
      query = {
        $or: [{ employee: userId }, { evaluator: userId }],
      };
    }

    const list = await ResponseModel.find(query)
      .populate("employee", "name email role department")
      .populate("evaluator", "name email role department")
      .populate("survey", "title surveyName status")
      .lean();

  res.json(list);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error.message || "Failed to fetch responses" });
  }
});

// GET /api/responses/:surveyId/:employeeId - Get specific response with answers
// Optional evaluatorId can be passed as a query param: /:surveyId/:employeeId?evaluatorId=...
router.get("/:surveyId/:employeeId", protect, async (req: any, res) => {
  try {
    const { surveyId, employeeId } = req.params;
    const evaluatorId = req.query.evaluatorId as string | undefined;

    const query: any = {
      survey: surveyId,
      employee: employeeId,
    };

    // When evaluatorId is provided (manager/teammate evaluations),
    // return that specific evaluator's response.
    if (evaluatorId) {
      query.evaluator = evaluatorId;
    }

    const response = await ResponseModel.findOne(query)
      .populate("survey", "title surveyName categories startDate endDate")
      .populate("employee", "name email department")
      .populate("evaluator", "name email department role");

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
