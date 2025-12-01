"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canUserAccessSurvey = canUserAccessSurvey;
exports.buildSurveyQuery = buildSurveyQuery;
/**
 * Check if a user can access a survey based on assignment rules
 */
function canUserAccessSurvey(survey, user) {
    // Admin can always access all surveys
    if (user.role === "admin") {
        return true;
    }
    const assignmentType = survey.assignmentType || "all";
    switch (assignmentType) {
        case "all":
            return true;
        case "admins":
            // Admins are already granted access above. Non-admins cannot access admin-only surveys.
            return false;
        case "managers":
            return user.role === "manager";
        case "employees":
            return user.role === "employee";
        case "department":
            if (!survey.assignedDepartments || survey.assignedDepartments.length === 0) {
                return false;
            }
            if (!user.department) {
                return false;
            }
            return survey.assignedDepartments.includes(user.department);
        case "specific":
            if (!survey.assignedUsers || survey.assignedUsers.length === 0) {
                return false;
            }
            const userIdStr = String(user._id);
            return survey.assignedUsers.some((assignedUserId) => assignedUserId.toString() === userIdStr);
        default:
            return false;
    }
}
/**
 * Build MongoDB query to filter surveys based on user role and assignments
 */
function buildSurveyQuery(user) {
    // Admin can see all surveys
    if (user.role === "admin") {
        return {};
    }
    // Manager can see:
    // 1. Surveys assigned to their department
    // 2. Surveys assigned specifically to them
    // 3. Surveys assigned to "all"
    // 4. Surveys assigned to "managers"
    if (user.role === "manager") {
        return {
            $or: [
                { assignmentType: "all" },
                { assignmentType: "managers" },
                {
                    assignmentType: "department",
                    assignedDepartments: user.department || "",
                },
                {
                    assignmentType: "specific",
                    assignedUsers: user._id,
                },
            ],
        };
    }
    // Employee (user) can see:
    // 1. Surveys assigned to "all"
    // 2. Surveys assigned to "employees"
    // 3. Surveys assigned specifically to them
    // 4. Surveys assigned to their department
    return {
        $or: [
            { assignmentType: "all" },
            { assignmentType: "employees" },
            {
                assignmentType: "department",
                assignedDepartments: user.department || "",
            },
            {
                assignmentType: "specific",
                assignedUsers: user._id,
            },
        ],
    };
}
