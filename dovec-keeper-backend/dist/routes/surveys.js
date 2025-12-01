"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Survey_1 = __importDefault(require("../models/Survey"));
const auth_1 = require("../middleware/auth");
const surveyAccess_1 = require("../utils/surveyAccess");
const router = (0, express_1.Router)();
// GET /api/surveys - Get surveys based on role and assignments
router.get("/", auth_1.protect, async (req, res) => {
    try {
        const query = (0, surveyAccess_1.buildSurveyQuery)(req.user);
        const surveys = await Survey_1.default.find(query).populate("createdBy", "name email");
        res.json(surveys);
    }
    catch (error) {
        res.status(500).json({ message: error.message || "Failed to fetch surveys" });
    }
});
// POST /api/surveys - Create survey (admin only)
router.post("/", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const survey = await Survey_1.default.create({ ...req.body, createdBy: req.user._id });
        res.json(survey);
    }
    catch (error) {
        res.status(400).json({ message: error.message || "Failed to create survey" });
    }
});
// GET /api/surveys/:id - Get specific survey (if user has access)
router.get("/:id", auth_1.protect, async (req, res) => {
    try {
        const survey = await Survey_1.default.findById(req.params.id).populate("createdBy", "name email");
        if (!survey) {
            return res.status(404).json({ message: "Survey not found" });
        }
        // Check if user can access this survey
        if (!(0, surveyAccess_1.canUserAccessSurvey)(survey, req.user)) {
            return res.status(403).json({ message: "You don't have access to this survey" });
        }
        res.json(survey);
    }
    catch (error) {
        res.status(500).json({ message: error.message || "Failed to fetch survey" });
    }
});
// PUT /api/surveys/:id - Update survey (admin only)
router.put("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const survey = await Survey_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!survey) {
            return res.status(404).json({ message: "Survey not found" });
        }
        res.json(survey);
    }
    catch (error) {
        res.status(400).json({ message: error.message || "Failed to update survey" });
    }
});
// DELETE /api/surveys/:id - Delete survey (admin only)
router.delete("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const survey = await Survey_1.default.findByIdAndDelete(req.params.id);
        if (!survey) {
            return res.status(404).json({ message: "Survey not found" });
        }
        res.json({ message: "Survey deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error.message || "Failed to delete survey" });
    }
});
exports.default = router;
