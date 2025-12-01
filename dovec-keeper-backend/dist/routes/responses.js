"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Response_1 = __importDefault(require("../models/Response"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/submit", auth_1.protect, async (req, res) => {
    // save as draft or submit
    const { survey, employee, answers, status } = req.body;
    const existing = await Response_1.default.findOne({ survey, employee });
    if (existing) {
        existing.answers = answers;
        existing.status = status || existing.status;
        if (status === "submitted")
            existing.submittedAt = new Date();
        await existing.save();
        return res.json(existing);
    }
    const created = await Response_1.default.create({ survey, employee, answers, status });
    res.json(created);
});
router.get("/", auth_1.protect, async (req, res) => {
    const list = await Response_1.default.find().populate("employee").populate("survey");
    res.json(list);
});
// GET /api/responses/:surveyId/:employeeId - Get specific response with answers
router.get("/:surveyId/:employeeId", auth_1.protect, async (req, res) => {
    try {
        const { surveyId, employeeId } = req.params;
        const response = await Response_1.default.findOne({
            survey: surveyId,
            employee: employeeId
        })
            .populate("survey", "title surveyName categories startDate endDate")
            .populate("employee", "name email department");
        if (!response) {
            return res.status(404).json({ message: "Response not found" });
        }
        res.json(response);
    }
    catch (error) {
        res.status(500).json({ message: error.message || "Failed to fetch response" });
    }
});
exports.default = router;
