import { Router } from "express";
import ResponseModel from "../models/Response";
import Subcategory from "../models/Subcategory";
import Category from "../models/Category";
import User from "../models/User";
import { protect } from "../middleware/auth";

const router = Router();

// Helper function to fetch subcategories for survey categories
async function getSubcategoriesForSurvey(survey: any): Promise<any[]> {
  try {
    const subcategoriesList: any[] = [];
    
    // Get all categories for this survey
    const categoryNamesOrIds = survey.categories || [];
    
    for (const categoryNameOrId of categoryNamesOrIds) {
      // Find category by name or ID
      let category;
      try {
        category = await Category.findOne({
          $or: [{ name: categoryNameOrId }, { _id: categoryNameOrId }],
        });
      } catch (err) {
        // If categoryNameOrId is not a valid ObjectId, just search by name
        category = await Category.findOne({ name: categoryNameOrId });
      }
      
      if (category && category._id) {
        // Fetch subcategories for this category
        const subcategories = await Subcategory.find({ category: category._id });
        // Attach category name to each subcategory for better classification
        const validSubcategories = (subcategories || [])
          .filter((sub: any) => sub && sub._id)
          .map((sub: any) => {
            const obj = sub.toObject ? sub.toObject() : sub;
            return {
              ...obj,
              categoryName: category.name || "",
            };
          });
        subcategoriesList.push(...validSubcategories);
      }
    }
    
    return subcategoriesList;
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    return [];
  }
}

// Helper function to calculate scores from answers and questions/subcategories.
// userKpi: KPI value from the employee record (User.kpi).
// Formulas:
//  - Performance Score = KPI * 0.5 + Team Effect * 10
//  - Contribution Score = Performance * 0.5 + Culture Harmony * 10 * 0.3 + Executive/Manager Evaluation * 10 * 0.2
//  - Potential Score = Potential * 20
//  - Keeper Score = Contribution * 0.6 + Potential Score * 0.4
function calculateScores(answers: any[], questions: any[], userKpi: number) {
  const scores = {
    kpiScore: 0,
    potential: 0, // average 1–5
    cultureHarmony: 0, // average 1–5
    teamEffect: 0, // average 1–5
    executiveObservation: 0, // average 1–5
    performanceScore: 0, // 0–100
    contributionScore: 0, // 0–100
    potentialScore: 0, // 0–100
    keeperScore: 0, // 0–100
  };

  // Map of questionId -> question (including subcategories with categoryName)
  const questionMap = new Map();
  questions.forEach((q) => {
    const id = q.id || q._id?.toString();
    if (!id) return;
    questionMap.set(id, q);
    if (q._id) {
      questionMap.set(q._id.toString(), q);
    }
  });

  // Map of questionId -> answer value
  const answerMap = new Map();
  (answers || []).forEach((a: any) => {
    if (!a || a.questionId === undefined || a.questionId === null) return;
    const key = a.questionId;
    answerMap.set(key, a.value);
    answerMap.set(String(key), a.value);
  });

  // Sums and counts for raw averages
  let totalPotential = 0;
  let potentialCount = 0;
  let totalCulture = 0;
  let cultureCount = 0;
  let totalTeam = 0;
  let teamCount = 0;
  let totalExecutive = 0;
  let executiveCount = 0;

  questions.forEach((question) => {
    const qId = question.id || question._id?.toString();
    let answerValue = qId !== undefined ? answerMap.get(qId) : undefined;

    // Fallback: try with _id as string
    if ((answerValue === undefined || answerValue === null) && question._id) {
      const altKey = String(question._id);
      if (answerMap.has(altKey)) {
        answerValue = answerMap.get(altKey);
      }
    }

    // Fallback for "question-{id}" keys
    if ((answerValue === undefined || answerValue === null) && qId) {
      const prefKey = `question-${qId}`;
      if (answerMap.has(prefKey)) {
        answerValue = answerMap.get(prefKey);
      }
    }

    if (answerValue === undefined || answerValue === null) {
      return;
    }

    const num = typeof answerValue === "number" ? Number(answerValue) : parseFloat(String(answerValue));
    if (isNaN(num)) return;

    const questionText = (question.name || question.text || "").toLowerCase();
    const questionType = (question.type || "").toLowerCase();
    const categoryName = (question.categoryName || "").toLowerCase();

    // Potential
    if (
      categoryName.includes("potential") ||
      categoryName.includes("potansiyel") ||
      questionType === "potential" ||
      questionText.includes("potential") ||
      questionText.includes("potansiyel")
    ) {
      totalPotential += num;
      potentialCount++;
      return;
    }

    // Culture / Culture Harmony
    if (
      categoryName.includes("culture harmony") ||
      categoryName.includes("kültür uyumu") ||
      categoryName.includes("culture") ||
      categoryName.includes("harmony") ||
      questionText.includes("culture") ||
      questionText.includes("harmony")
    ) {
      totalCulture += num;
      cultureCount++;
      return;
    }

    // Team Effect
    if (
      categoryName.includes("team effect") ||
      categoryName.includes("takım etkisi") ||
      categoryName.includes("team") ||
      categoryName.includes("team impact") ||
      questionText.includes("team") ||
      questionText.includes("team effect") ||
      questionText.includes("team impact")
    ) {
      totalTeam += num;
      teamCount++;
      return;
    }

    // Executive / Manager Evaluation
    if (
      categoryName.includes("executive observation") ||
      categoryName.includes("yönetici gözlemi") ||
      categoryName.includes("manager evaluation") ||
      categoryName.includes("executive") ||
      categoryName.includes("observation") ||
      questionText.includes("executive") ||
      questionText.includes("observation") ||
      questionText.includes("manager evaluation") ||
      questionText.includes("yönetici")
    ) {
      totalExecutive += num;
      executiveCount++;
      return;
    }
  });

  // Compute raw averages (1–5 scale)
  const avgPotential = potentialCount > 0 ? totalPotential / potentialCount : 0;
  const avgCulture = cultureCount > 0 ? totalCulture / cultureCount : 0;
  const avgTeam = teamCount > 0 ? totalTeam / teamCount : 0;
  const avgExecutive = executiveCount > 0 ? totalExecutive / executiveCount : 0;

  // Save raw averages
  scores.potential = avgPotential;
  scores.cultureHarmony = avgCulture;
  scores.teamEffect = avgTeam;
  scores.executiveObservation = avgExecutive;

  // Use KPI from employee record (0–100 expected)
  const kpi = typeof userKpi === "number" && !isNaN(userKpi) ? userKpi : 0;
  scores.kpiScore = kpi;

  // Apply business formulas
  // Performance Score = KPI * 0.5 + Team Effect * 10
  const performanceScore = kpi * 0.5 + avgTeam * 10;
  scores.performanceScore = performanceScore;

  // Contribution Score = Performance * 0.5 + Culture Harmony * 10 * 0.3 + Executive * 10 * 0.2
  const cultureScore = avgCulture * 10;
  const executiveScore = avgExecutive * 10;
  const contributionScore =
    performanceScore * 0.5 + cultureScore * 0.3 + executiveScore * 0.2;
  scores.contributionScore = contributionScore;

  // Potential Score = Potential * 20
  const potentialScore = avgPotential * 20;
  scores.potentialScore = potentialScore;

  // Keeper Score = Contribution * 0.6 + Potential Score * 0.4
  scores.keeperScore = contributionScore * 0.6 + potentialScore * 0.4;

  return scores;
}

// GET /api/results - Get calculated results for all employees
router.get("/", protect, async (req: any, res) => {
  try {
    // Fetch all submitted responses with populated employee and survey
    let responsesQuery: any = { status: "submitted" };
    
    // Managers can see results for users in their department (and themselves)
    // Note: We'll filter by department after populating employee
    
    const allResponses = await ResponseModel.find(responsesQuery)
      .populate("employee", "name email role department")
      .populate("survey", "title questions categories")
      .sort({ submittedAt: -1 });
    
    // Filter by department for managers (they can see their own results and their department)
    // Also filter out any responses with null employees
    let responses = allResponses.filter((response: any) => {
      const employee = response.employee as any;
      return employee && employee._id; // Filter out null employees
    });
    
    if (req.user.role === "manager") {
      const managerId = req.user._id.toString();
      responses = responses.filter((response: any) => {
        const employee = response.employee as any;
        if (!employee || !employee._id) return false;
        // Manager can see their own results OR results from their department
        const isOwnResult = employee._id?.toString() === managerId || employee.id?.toString() === managerId;
        const isSameDepartment = req.user.department && employee.department === req.user.department;
        return isOwnResult || isSameDepartment;
      });
    }

    // Group responses by employee
    const employeeResultsMap = new Map();

    // Cache for employee KPI values to avoid repeated DB hits
    const employeeKpiCache = new Map<string, number>();

    for (const response of responses) {
      const employee = response.employee as any;
      const survey = response.survey as any;

      // Skip if employee or survey is null/undefined
      if (!employee || !survey) continue;
      
      // Skip if employee or survey doesn't have _id
      if (!employee._id || !survey._id) continue;
      
      // Additional department check for managers (double-check)
      if (req.user.role === "manager") {
        const managerId = req.user._id.toString();
        const isOwnResult =
          employee._id?.toString() === managerId || employee.id?.toString() === managerId;
        const isSameDepartment =
          req.user.department && employee.department === req.user.department;
        if (!isOwnResult && !isSameDepartment) {
          continue;
        }
      }

      const employeeId = employee._id.toString();
      const surveyId = survey._id.toString();
      const employeeName = employee.name || "Unknown";
      const department = employee.department || "N/A";
      const surveyTitle = survey.title || "Unknown Survey";

      // Load KPI for this employee (from DB), with simple cache
      let userKpi = employeeKpiCache.get(employeeId);
      if (userKpi === undefined) {
        const userDoc = await User.findById(employee._id).select("kpi");
        userKpi = (userDoc && typeof userDoc.kpi === "number" ? userDoc.kpi : 0) as number;
        employeeKpiCache.set(employeeId, userKpi);
      }
      
      // Create unique key for employee + survey combination
      const resultKey = `${employeeId}_${surveyId}`;

      // Get or create employee+survey result entry
      if (!employeeResultsMap.has(resultKey)) {
        employeeResultsMap.set(resultKey, {
          _id: resultKey,
          id: resultKey,
          employeeId: employeeId,
          surveyId: surveyId,
          surveyTitle: surveyTitle,
          employeeName,
          department,
          date: response.submittedAt
            ? new Date(response.submittedAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
          kpiScore: userKpi,
          potential: 0,
          cultureHarmony: 0,
          teamEffect: 0,
          executiveObservation: 0,
          performanceScore: 0,
          contributionScore: 0,
          potentialScore: 0,
          keeperScore: 0,
          responseCount: 0,
          totalScores: {
            kpiScore: 0,
            potential: 0,
            cultureHarmony: 0,
            teamEffect: 0,
            executiveObservation: 0,
            performanceScore: 0,
            contributionScore: 0,
            potentialScore: 0,
            keeperScore: 0,
          },
        });
      }

      const employeeResult = employeeResultsMap.get(resultKey);
      if (!employeeResult) continue; // Safety check

      // Calculate scores for this response
      // First try to get subcategories for the survey categories
      let questionsForCalculation = survey.questions || [];
      
      // If no questions in survey, fetch subcategories
      if (questionsForCalculation.length === 0) {
        const subcategories = await getSubcategoriesForSurvey(survey);
        // Convert subcategories to question format for calculateScores
        questionsForCalculation = (subcategories || [])
          .filter((subcat: any) => subcat && subcat._id)
          .map((subcat: any) => ({
            id: subcat._id.toString(),
            _id: subcat._id,
            text: subcat.name,
            name: subcat.name,
            type: "",
            categoryName: subcat.categoryName || "",
          }));
      } else {
        // If survey has questions, also try to get subcategories to match answer IDs
        const subcategories = await getSubcategoriesForSurvey(survey);
        // Add subcategories to questions list (they might be the actual questions)
        const subcategoryQuestions = (subcategories || [])
          .filter((subcat: any) => subcat && subcat._id)
          .map((subcat: any) => ({
            id: subcat._id.toString(),
            _id: subcat._id,
            text: subcat.name,
            name: subcat.name,
            type: "",
            categoryName: subcat.categoryName || "",
          }));
        questionsForCalculation = [...questionsForCalculation, ...subcategoryQuestions];
      }
      
      const calculatedScores = calculateScores(
        response.answers,
        questionsForCalculation,
        userKpi
      );

      // Accumulate scores (we'll average them later)
      // KPI comes from DB and is constant; store once
      employeeResult.kpiScore = userKpi;
      employeeResult.totalScores.potential += calculatedScores.potential;
      employeeResult.totalScores.cultureHarmony += calculatedScores.cultureHarmony;
      employeeResult.totalScores.teamEffect += calculatedScores.teamEffect;
      employeeResult.totalScores.executiveObservation += calculatedScores.executiveObservation;
      employeeResult.totalScores.performanceScore += calculatedScores.performanceScore;
      employeeResult.totalScores.contributionScore += calculatedScores.contributionScore;
      employeeResult.totalScores.potentialScore += calculatedScores.potentialScore;
      employeeResult.totalScores.keeperScore += calculatedScores.keeperScore;
      employeeResult.responseCount++;

      // Update date to most recent submission
      if (response.submittedAt) {
        const submittedDate = new Date(response.submittedAt);
        const currentDate = new Date(employeeResult.date);
        if (submittedDate > currentDate) {
          employeeResult.date = submittedDate.toLocaleDateString();
        }
      }
    }

    // Calculate averages for each employee+survey combination
    let results = Array.from(employeeResultsMap.values()).map((result) => {
      const count = result.responseCount || 1;
      return {
        _id: result._id,
        id: result.id,
        employeeId: result.employeeId,
        surveyId: result.surveyId,
        surveyTitle: result.surveyTitle,
        employeeName: result.employeeName,
        department: result.department,
        date: result.date,
        kpiScore: result.kpiScore ?? 0,
        potential: result.totalScores.potential / count,
        cultureHarmony: result.totalScores.cultureHarmony / count,
        teamEffect: result.totalScores.teamEffect / count,
        executiveObservation: result.totalScores.executiveObservation / count,
        performanceScore: result.totalScores.performanceScore / count,
        contributionScore: result.totalScores.contributionScore / count,
        potentialScore: result.totalScores.potentialScore / count,
        keeperScore: result.totalScores.keeperScore / count,
      };
    });

    // Managers should not see results for "yönetici" (manager) surveys in the list
    if (req.user.role === "manager") {
      results = results.filter((r: any) => {
        const title = (r.surveyTitle || "").toLowerCase();
        return !title.includes("yönetici");
      });
    }

    res.json(results);
  } catch (error: any) {
    console.error("Error calculating results:", error);
    res.status(500).json({ message: error.message || "Failed to calculate results" });
  }
});

// GET /api/results/:employeeId - Get results for a specific employee
router.get("/:employeeId", protect, async (req: any, res) => {
  try {
    const { employeeId } = req.params;

    // Get all submitted responses and filter by employee ID
    // This approach is more reliable as it handles different ID formats
    const allResponses = await ResponseModel.find({ status: "submitted" })
      .populate("employee", "name email role department kpi")
      .populate("survey", "title questions categories")
      .sort({ submittedAt: -1 });
    
    // For managers, verify the employee is in their department OR is themselves
    if (req.user.role === "manager") {
      const managerId = req.user._id.toString();
      const isViewingSelf = employeeId === managerId;
      
      if (!isViewingSelf) {
        const targetEmployee = allResponses.find((r: any) => {
          const emp = r.employee as any;
          if (!emp) return false;
          const empId = emp._id?.toString() || emp.id?.toString();
          return empId === employeeId;
        });
        
        if (targetEmployee) {
          const emp = targetEmployee.employee as any;
          // Manager can only see results for employees in their department (not themselves, already checked)
          if (emp.department !== req.user.department) {
            return res.status(403).json({ 
              message: "You can only view results for employees in your department or your own results" 
            });
          }
        }
      }
      // If viewing self, allow access
    }

    // Filter responses where employee ID matches (handles both ObjectId and string formats)
    // Also filter out any responses with null employees
    const responses = allResponses.filter((response: any) => {
      const emp = response.employee as any;
      if (!emp || !emp._id) return false;
      
      const empId = emp._id?.toString() || emp.id?.toString() || emp._id || emp.id;
      return empId === employeeId || empId?.toString() === employeeId?.toString();
    });

    if (responses.length === 0) {
      return res.status(404).json({ 
        message: "No results found for this employee"
      });
    }

    // Calculate aggregated scores for this employee
    const employee = responses[0].employee as any;
    const userKpi =
      employee && typeof employee.kpi === "number" ? (employee.kpi as number) : 0;
    let totalScores = {
      kpiScore: 0,
      potential: 0,
      cultureHarmony: 0,
      teamEffect: 0,
      executiveObservation: 0,
      performanceScore: 0,
      contributionScore: 0,
      potentialScore: 0,
      keeperScore: 0,
    };

    // Simple averages for specific survey types
    // Average of all numeric answers from "yönetici" (manager) forms
    let managerFormTotal = 0;
    let managerFormCount = 0;
    // Average of all numeric answers from "takım arkadaşı" (teammate) forms
    let teammateFormTotal = 0;
    let teammateFormCount = 0;

    for (const response of responses) {
      const survey = response.survey as any;
      
      // Skip if survey is null
      if (!survey || !survey._id) continue;
      
      const surveyTitle = (survey.title || "").toLowerCase();
      const isManagerForm = surveyTitle.includes("yönetici");
      const isTeammateForm = surveyTitle.includes("takım arkadaşı");

      // Get questions/subcategories for calculation
      let questionsForCalculation = survey.questions || [];
      
      // If no questions in survey, fetch subcategories
      if (questionsForCalculation.length === 0) {
        const subcategories = await getSubcategoriesForSurvey(survey);
        // Convert subcategories to question format for calculateScores
        questionsForCalculation = (subcategories || [])
          .filter((subcat: any) => subcat && subcat._id)
          .map((subcat: any) => ({
            id: subcat._id.toString(),
            _id: subcat._id,
            text: subcat.name,
            name: subcat.name,
            type: "",
            categoryName: subcat.categoryName || "",
          }));
      } else {
        // If survey has questions, also try to get subcategories to match answer IDs
        const subcategories = await getSubcategoriesForSurvey(survey);
        // Add subcategories to questions list
        const subcategoryQuestions = (subcategories || [])
          .filter((subcat: any) => subcat && subcat._id)
          .map((subcat: any) => ({
            id: subcat._id.toString(),
            _id: subcat._id,
            text: subcat.name,
            name: subcat.name,
            type: "",
            categoryName: subcat.categoryName || "",
          }));
        questionsForCalculation = [...questionsForCalculation, ...subcategoryQuestions];
      }
      
      const calculatedScores = calculateScores(
        response.answers,
        questionsForCalculation,
        userKpi
      );

      Object.keys(totalScores).forEach((key) => {
        totalScores[key as keyof typeof totalScores] += calculatedScores[key as keyof typeof calculatedScores];
      });

      // Also accumulate simple averages for manager / teammate forms
      const rawAnswers = Array.isArray(response.answers) ? response.answers : [];
      for (const ans of rawAnswers) {
        const rawValue = (ans as any).value;
        const numValue =
          typeof rawValue === "number" ? rawValue : parseFloat(rawValue);
        if (isNaN(numValue)) continue;

        if (isManagerForm) {
          managerFormTotal += numValue;
          managerFormCount++;
        }
        if (isTeammateForm) {
          teammateFormTotal += numValue;
          teammateFormCount++;
        }
      }
    }

    const count = responses.length;
    const result = {
      _id: employee._id.toString(),
      id: employee._id.toString(),
      employeeName: employee.name || "Unknown",
      department: employee.department || "N/A",
      date: responses[0].submittedAt
        ? new Date(responses[0].submittedAt).toLocaleDateString()
        : new Date().toLocaleDateString(),
      kpiScore: userKpi,
      potential: totalScores.potential / count,
      cultureHarmony: totalScores.cultureHarmony / count,
      teamEffect: totalScores.teamEffect / count,
      executiveObservation: totalScores.executiveObservation / count,
      performanceScore: totalScores.performanceScore / count,
      contributionScore: totalScores.contributionScore / count,
      potentialScore: totalScores.potentialScore / count,
      keeperScore: totalScores.keeperScore / count,
      managerFormAverage:
        managerFormCount > 0 ? managerFormTotal / managerFormCount : 0,
      teammateFormAverage:
        teammateFormCount > 0 ? teammateFormTotal / teammateFormCount : 0,
      role: employee.role,
    };

    res.json(result);
  } catch (error: any) {
    console.error("Error fetching employee results:", error);
    res.status(500).json({ message: error.message || "Failed to fetch employee results" });
  }
});

export default router;

