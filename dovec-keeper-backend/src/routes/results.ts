import { Router } from "express";
import mongoose from "mongoose";
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
          $or: [
            { name: categoryNameOrId },
            { _id: categoryNameOrId }
          ]
        });
      } catch (err) {
        // If categoryNameOrId is not a valid ObjectId, just search by name
        category = await Category.findOne({ name: categoryNameOrId });
      }
      
      if (category && category._id) {
        // Fetch subcategories for this category and populate category name
        const subcategories = await Subcategory.find({ category: category._id }).populate("category", "name");
        // Filter out any null subcategories and add category name to each
        const validSubcategories = (subcategories || []).filter((sub: any) => sub && sub._id).map((sub: any) => {
          const subObj = sub.toObject ? sub.toObject() : sub;
          // Extract category name from populated category object
          const catName = subObj.category?.name || (typeof subObj.category === 'string' ? subObj.category : category.name) || category.name || "";
          return {
            ...subObj,
            categoryName: catName
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

// Helper function to calculate scores from answers and questions/subcategories
// userKpi: KPI value from database (admin-entered, not from survey)
function calculateScores(answers: any[], questions: any[], userKpi: number = 0) {
  const scores = {
    kpiScore: userKpi, // Use KPI from database
    potential: 0,
    cultureHarmony: 0,
    teamEffect: 0,
    executiveObservation: 0,
    performanceScore: 0,
    contributionScore: 0,
    potentialScore: 0,
    keeperScore: 0,
  };

  // Create a map of questionId to question/subcategory for quick lookup
  const questionMap = new Map();
  questions.forEach((q) => {
    // Support both question format (with id) and subcategory format (with _id)
    const id = q.id || q._id?.toString();
    if (id) {
      questionMap.set(id, q);
      // Also map _id as string for subcategories
      if (q._id) {
        questionMap.set(q._id.toString(), q);
      }
    }
  });

  // Create a map of questionId to answer value
  // Normalize all IDs to strings for consistent matching
  const answerMap = new Map();
  answers.forEach((a) => {
    if (!a.questionId) return;
    
    // Normalize the questionId to string
    const qId = a.questionId.toString();
    answerMap.set(qId, a.value);
    
    // Also store with ObjectId format if it's a valid ObjectId
    try {
      if (mongoose.Types.ObjectId.isValid(qId)) {
        const objId = new mongoose.Types.ObjectId(qId);
        answerMap.set(objId.toString(), a.value);
        // Also store the ObjectId itself as key
        answerMap.set(objId, a.value);
      }
    } catch (e) {
      // Ignore ObjectId conversion errors
    }
  });
  
  // Debug logging
  console.log("=== CALCULATION DEBUG ===");
  console.log("User KPI:", userKpi);
  console.log("Answers count:", answers.length);
  console.log("Answer IDs:", Array.from(answerMap.keys()));
  console.log("Questions count:", questions.length);
  console.log("Question details:");
  questions.forEach((q, idx) => {
    console.log(`  Q${idx + 1}: ${q.name || q.text} | Category: ${q.categoryName || 'N/A'} | ID: ${q._id?.toString() || q.id || 'N/A'}`);
  });

  // Calculate scores based on question types and text
  // Note: KPI is not calculated from survey, it comes from database (userKpi parameter)
  let totalPotential = 0;
  let potentialCount = 0;
  let totalCulture = 0;
  let cultureCount = 0;
  let totalTeam = 0;
  let teamCount = 0;
  let totalExecutive = 0;
  let executiveCount = 0;

  questions.forEach((question) => {
    // Try multiple ways to match question ID
    // Normalize all IDs to strings for consistent matching
    let answerValue: any = undefined;
    
    // Get all possible ID representations
    const questionId = question.id || question._id;
    const questionIdStr = questionId?.toString() || "";
    const questionIdObj = question._id;
    
    // Try direct string match first
    if (questionIdStr) {
      answerValue = answerMap.get(questionIdStr);
    }
    
    // Try with _id as string
    if (answerValue === undefined && questionIdObj) {
      const qIdStr = questionIdObj.toString();
      answerValue = answerMap.get(qIdStr);
    }
    
    // Try with _id as ObjectId
    if (answerValue === undefined && questionIdObj) {
      answerValue = answerMap.get(questionIdObj);
    }
    
    // Try the "question-{id}" format (for old responses)
    if (answerValue === undefined && questionIdStr) {
      answerValue = answerMap.get(`question-${questionIdStr}`);
    }
    
    // If still not found, try matching by exact string comparison with all answer keys
    if (answerValue === undefined && questionIdStr) {
      const answerKeys = Array.from(answerMap.keys());
      for (const key of answerKeys) {
        const keyStr = key.toString();
        // Exact match (case-insensitive for safety)
        if (keyStr.toLowerCase() === questionIdStr.toLowerCase()) {
          answerValue = answerMap.get(key);
          break;
        }
      }
    }
    
    // Debug logging for unmatched questions
    if (answerValue === undefined || answerValue === null) {
      console.log(`  ❌ No answer found for question: ${question.name || question.text || questionIdStr} (ID: ${questionIdStr})`);
      return;
    }

    const numValue = typeof answerValue === "number" ? answerValue : parseFloat(answerValue);
    if (isNaN(numValue)) {
      console.log(`  ⚠️ Invalid answer value for question: ${question.name || question.text || questionIdStr} (value: ${answerValue})`);
      return;
    }

    // For subcategories, use the name; for questions, use text
    const questionText = ((question.name || question.text || "").toLowerCase());
    const questionType = (question.type || "").toLowerCase();
    // Also check category name if available (for subcategories)
    const categoryName = (question.categoryName || "").toLowerCase();

    // Debug logging for categorization
    console.log(`  ✓ Matched question: ${question.name || question.text} | Category: ${categoryName || 'N/A'} | Answer: ${numValue}`);

    // Categorize questions based on category name first (more reliable), then question text
    // Note: KPI is NOT calculated from survey - it comes from database
    // Expected category names (English): "Potential", "Culture Harmony", "Team Effect", "Executive Observation"
    // Expected category names (Turkish): "Potansiyel", "Kültür Uyumu", "Takım Etkisi", "Yönetici Gözlemi"
    
    // Check category name first (most reliable) - match both English and Turkish category names
    const isPotential = 
      categoryName.includes("potential") || 
      categoryName.includes("potansiyel") ||
      questionType === "potential" || 
      questionText.includes("potential") ||
      questionText.includes("potansiyel");
    
    const isCulture = 
      categoryName.includes("culture harmony") || 
      categoryName.includes("kültür uyumu") ||
      (categoryName.includes("culture") && categoryName.includes("harmony")) ||
      (categoryName.includes("kültür") && categoryName.includes("uyumu")) ||
      categoryName.includes("culture") || 
      categoryName.includes("harmony") || 
      categoryName.includes("kültür") ||
      questionText.includes("culture") || 
      questionText.includes("harmony");
    
    const isTeam = 
      categoryName.includes("team effect") || 
      categoryName.includes("takım etkisi") ||
      (categoryName.includes("team") && categoryName.includes("effect")) ||
      (categoryName.includes("takım") && categoryName.includes("etkisi")) ||
      categoryName.includes("team") || 
      categoryName.includes("team impact") ||
      categoryName.includes("takım") ||
      questionText.includes("team") || 
      questionText.includes("team effect") ||
      questionText.includes("team impact");
    
    const isExecutive = 
      categoryName.includes("executive observation") || 
      categoryName.includes("yönetici gözlemi") ||
      (categoryName.includes("executive") && categoryName.includes("observation")) ||
      (categoryName.includes("yönetici") && categoryName.includes("gözlemi")) ||
      categoryName.includes("executive") || 
      categoryName.includes("observation") || 
      categoryName.includes("manager evaluation") ||
      categoryName.includes("yönetici") ||
      questionText.includes("executive") || 
      questionText.includes("observation") || 
      questionText.includes("manager evaluation");

    if (isPotential) {
      totalPotential += numValue;
      potentialCount++;
      console.log(`    → Categorized as POTENTIAL`);
    }
    if (isCulture) {
      totalCulture += numValue;
      cultureCount++;
      console.log(`    → Categorized as CULTURE`);
    }
    if (isTeam) {
      totalTeam += numValue;
      teamCount++;
      console.log(`    → Categorized as TEAM`);
    }
    if (isExecutive) {
      totalExecutive += numValue;
      executiveCount++;
      console.log(`    → Categorized as EXECUTIVE`);
    }
  });

  // Calculate averages for survey-based metrics
  scores.potential = potentialCount > 0 ? totalPotential / potentialCount : 0;
  scores.cultureHarmony = cultureCount > 0 ? totalCulture / cultureCount : 0;
  scores.teamEffect = teamCount > 0 ? totalTeam / teamCount : 0;
  scores.executiveObservation = executiveCount > 0 ? totalExecutive / executiveCount : 0;

  // Debug logging for category averages
  console.log("Category Averages:");
  console.log(`  Potential: ${scores.potential} (from ${potentialCount} questions)`);
  console.log(`  Culture Harmony: ${scores.cultureHarmony} (from ${cultureCount} questions)`);
  console.log(`  Team Effect: ${scores.teamEffect} (from ${teamCount} questions)`);
  console.log(`  Executive Observation: ${scores.executiveObservation} (from ${executiveCount} questions)`);

  // Calculate scores using the new formulas:
  // 1. Performance Score = KPI × 0.5 + Team Effect × 10
  scores.performanceScore = (userKpi * 0.5) + (scores.teamEffect * 10);

  // 2. Contribution Score = Performance × 0.5 + Culture Harmony × 10 × 0.3 + Executive Observation × 10 × 0.2
  scores.contributionScore = 
    (scores.performanceScore * 0.5) + 
    (scores.cultureHarmony * 10 * 0.3) + 
    (scores.executiveObservation * 10 * 0.2);

  // 3. Potential Score = Potential × 20
  scores.potentialScore = scores.potential * 20;

  // 4. Keeper Score = Contribution × 0.6 + Potential × 0.4
  scores.keeperScore = (scores.contributionScore * 0.6) + (scores.potentialScore * 0.4);

  // Debug logging for calculated scores
  console.log("Calculated Scores:");
  console.log(`  Performance Score: ${scores.performanceScore}`);
  console.log(`  Contribution Score: ${scores.contributionScore}`);
  console.log(`  Potential Score: ${scores.potentialScore}`);
  console.log(`  Keeper Score: ${scores.keeperScore}`);
  console.log("=== END CALCULATION DEBUG ===\n");

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
      .populate("employee", "name email role department kpi")
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
    
    // Cache for employee KPIs to avoid multiple database queries for the same employee
    const employeeKpiCache = new Map<string, number>();

    for (const response of responses) {
      const employee = response.employee as any;
      const survey = response.survey as any;

      // Skip if employee or survey is null/undefined
      if (!employee || !survey) continue;
      
      // Skip if employee or survey doesn't have _id
      if (!employee._id || !survey._id) continue;
      
      // Additional department check for managers (double-check)
      // Manager can see their own results OR results from their department
      if (req.user.role === "manager") {
        const managerId = req.user._id.toString();
        const isOwnResult = employee._id?.toString() === managerId || employee.id?.toString() === managerId;
        const isSameDepartment = req.user.department && employee.department === req.user.department;
        if (!isOwnResult && !isSameDepartment) {
          continue;
        }
      }

      const employeeId = employee._id.toString();
      const surveyId = survey._id.toString();
      const employeeName = employee.name || "Unknown";
      const department = employee.department || "N/A";
      const surveyTitle = survey.title || "Unknown Survey";
      
      // Fetch latest KPI from database to ensure we have the most recent value
      // This is important because KPI can be updated by admins
      // Use cache to avoid multiple queries for the same employee
      let userKpi = employeeKpiCache.get(employeeId);
      if (userKpi === undefined) {
        const userDoc = await User.findById(employee._id).select("kpi");
        userKpi = userDoc?.kpi || 0;
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
          kpiScore: userKpi, // Use KPI from database
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

      // Only calculate scores for keeper surveys
      const surveyTitleLower = (survey.title || "").toLowerCase();
      const isKeeperSurvey = surveyTitleLower.includes("keeper");
      
      console.log(`\n📊 Processing survey: "${survey.title}" | Is Keeper: ${isKeeperSurvey}`);
      
      if (!isKeeperSurvey) {
        // For non-keeper surveys, set scores to 0 or skip calculation
        console.log(`  ⏭️ Skipping non-keeper survey: "${survey.title}"`);
        continue; // Skip non-keeper surveys in the main results list
      }
      
      console.log(`  ✅ Processing keeper survey for employee: ${employeeName}`);
      
      // Calculate scores for this response
      // First try to get subcategories for the survey categories
      let questionsForCalculation = survey.questions || [];
      
      // If no questions in survey, fetch subcategories
      if (questionsForCalculation.length === 0) {
        const subcategories = await getSubcategoriesForSurvey(survey);
        // Convert subcategories to question format for calculateScores
        questionsForCalculation = (subcategories || []).filter((subcat: any) => subcat && subcat._id).map((subcat: any) => ({
          id: subcat._id.toString(),
          _id: subcat._id,
          text: subcat.name,
          name: subcat.name,
          type: "", // Subcategories don't have type, will be categorized by category name
          categoryName: subcat.categoryName || "" // Include category name for categorization
        }));
      } else {
        // If survey has questions, also try to get subcategories to match answer IDs
        const subcategories = await getSubcategoriesForSurvey(survey);
        // Add subcategories to questions list (they might be the actual questions)
        const subcategoryQuestions = (subcategories || []).filter((subcat: any) => subcat && subcat._id).map((subcat: any) => ({
          id: subcat._id.toString(),
          _id: subcat._id,
          text: subcat.name,
          name: subcat.name,
          type: "",
          categoryName: subcat.categoryName || "" // Include category name for categorization
        }));
        questionsForCalculation = [...questionsForCalculation, ...subcategoryQuestions];
      }
      
      // userKpi is already declared earlier in the scope
      // Ensure answers is an array before calculating
      const answers = Array.isArray(response.answers) ? response.answers : [];
      const calculatedScores = calculateScores(answers, questionsForCalculation, userKpi);
      
      // Update kpiScore in the result entry (constant from database)
      employeeResult.kpiScore = userKpi;

      // Accumulate scores (we'll average them later)
      // Note: kpiScore is not accumulated since it's the same for all responses (from database)
      employeeResult.totalScores.kpiScore = userKpi; // Set directly, don't accumulate
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
    const results = Array.from(employeeResultsMap.values()).map((result) => {
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
        kpiScore: result.kpiScore || 0, // Use KPI from database (constant, not averaged)
        potential: result.totalScores.potential / count,
        cultureHarmony: result.totalScores.cultureHarmony / count,
        teamEffect: result.totalScores.teamEffect / count,
        executiveObservation: result.totalScores.executiveObservation / count,
        // These scores are already calculated using the new formulas in calculateScores
        performanceScore: result.totalScores.performanceScore / count,
        contributionScore: result.totalScores.contributionScore / count,
        potentialScore: result.totalScores.potentialScore / count,
        keeperScore: result.totalScores.keeperScore / count,
      };
    });

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
    // Only include keeper surveys for aggregated calculations
    const employee = responses[0].employee as any;
    
    // Fetch user's KPI from database (always fetch fresh to get latest value)
    const userDoc = await User.findById(employee._id).select("kpi");
    const userKpi = userDoc?.kpi || 0;
    console.log(`📊 Fetching results for employee ${employee._id}: KPI = ${userKpi}`);
    
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

    let keeperResponseCount = 0;

    for (const response of responses) {
      const survey = response.survey as any;
      
      // Skip if survey is null
      if (!survey || !survey._id) continue;
      
      // Only calculate scores for keeper surveys
      const surveyTitle = (survey.title || "").toLowerCase();
      const isKeeperSurvey = surveyTitle.includes("keeper");
      
      if (!isKeeperSurvey) {
        continue; // Skip non-keeper surveys
      }
      
      // Get questions/subcategories for calculation
      let questionsForCalculation = survey.questions || [];
      
      // If no questions in survey, fetch subcategories
      if (questionsForCalculation.length === 0) {
        const subcategories = await getSubcategoriesForSurvey(survey);
        // Convert subcategories to question format for calculateScores
        questionsForCalculation = (subcategories || []).filter((subcat: any) => subcat && subcat._id).map((subcat: any) => ({
          id: subcat._id.toString(),
          _id: subcat._id,
          text: subcat.name,
          name: subcat.name,
          type: "",
          categoryName: subcat.categoryName || "" // Include category name for categorization
        }));
      } else {
        // If survey has questions, also try to get subcategories to match answer IDs
        const subcategories = await getSubcategoriesForSurvey(survey);
        // Add subcategories to questions list
        const subcategoryQuestions = (subcategories || []).filter((subcat: any) => subcat && subcat._id).map((subcat: any) => ({
          id: subcat._id.toString(),
          _id: subcat._id,
          text: subcat.name,
          name: subcat.name,
          type: ""
        }));
        questionsForCalculation = [...questionsForCalculation, ...subcategoryQuestions];
      }
      
      // Ensure answers is an array before calculating
      const answers = Array.isArray(response.answers) ? response.answers : [];
      console.log(`   📊 Calculating scores for survey "${survey.title}" with KPI: ${userKpi}`);
      const calculatedScores = calculateScores(answers, questionsForCalculation, userKpi);
      console.log(`   ✅ Calculated scores: Performance=${calculatedScores.performanceScore.toFixed(2)}, Contribution=${calculatedScores.contributionScore.toFixed(2)}, Keeper=${calculatedScores.keeperScore.toFixed(2)}`);

      // Accumulate scores (except kpiScore which is constant from database)
      totalScores.potential += calculatedScores.potential;
      totalScores.cultureHarmony += calculatedScores.cultureHarmony;
      totalScores.teamEffect += calculatedScores.teamEffect;
      totalScores.executiveObservation += calculatedScores.executiveObservation;
      totalScores.performanceScore += calculatedScores.performanceScore;
      totalScores.contributionScore += calculatedScores.contributionScore;
      totalScores.potentialScore += calculatedScores.potentialScore;
      totalScores.keeperScore += calculatedScores.keeperScore;
      // kpiScore is constant (from database), don't accumulate
      
      keeperResponseCount++;
    }

    const count = keeperResponseCount || 1; // Use keeper survey count, not all responses
    const result = {
      _id: employee._id.toString(),
      id: employee._id.toString(),
      employeeName: employee.name || "Unknown",
      department: employee.department || "N/A",
      date: responses[0].submittedAt
        ? new Date(responses[0].submittedAt).toLocaleDateString()
        : new Date().toLocaleDateString(),
      kpiScore: userKpi, // Use KPI from database, not calculated from survey
      potential: totalScores.potential / count,
      cultureHarmony: totalScores.cultureHarmony / count,
      teamEffect: totalScores.teamEffect / count,
      executiveObservation: totalScores.executiveObservation / count,
      performanceScore: totalScores.performanceScore / count,
      contributionScore: totalScores.contributionScore / count,
      potentialScore: totalScores.potentialScore / count,
      keeperScore: totalScores.keeperScore / count,
    };

    res.json(result);
  } catch (error: any) {
    console.error("Error fetching employee results:", error);
    res.status(500).json({ message: error.message || "Failed to fetch employee results" });
  }
});

export default router;

