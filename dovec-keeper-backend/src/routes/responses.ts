import { Router } from "express";
import ResponseModel from "../models/Response";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/submit", protect, async (req: any, res) => {
  // save as draft or submit
  const { survey, employee, answers, status } = req.body;
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
    const surveyTitle = (survey?.title || survey?.surveyName || "").toLowerCase();
    const isManagerForm = surveyTitle.includes("yönetici");

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
