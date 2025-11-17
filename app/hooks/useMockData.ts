import { useState, useMemo, useEffect } from 'react';
import {
    user,
    initialEvaluations,
    mySurveysData,
    initialCategories,
    initialCategoriesWithSubcategories,
    initialManagementSurveys,
    initialResultsData,
    employees,
    departments,
    type Evaluation,
    type Survey,
    type Category,
    type Subcategory,
    type CategoryWithSubcategories,
    type ResultData,
    type EmployeeResult
} from './mockData';

export type { Evaluation, Survey, Category, Subcategory, CategoryWithSubcategories, ResultData };

export type StatBoxProps = {
    title: string;
    count: number;
};

//--------------Date Formatting--------------------------
export function formatDate(dateString: string, fallback: string = '-') {
    if (!dateString) return fallback;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return fallback;
    }
    return date.toLocaleDateString("en-US"); // Format the date to MM/DD/YYYY
}

// ----------------- Calculating scores ------------------ //
// These functions are used to calculate the scores for the employees and will be used in the results page and the users page
export const calculatePerformanceScore = (kpiScore: number, teamEffect: number) => {
    return (kpiScore * 0.5) + (teamEffect * 10); // Performance Score = (KPI Score * 0.5) + (Team Effect * 10)
};
export const calculateContributionScore = (performanceScore: number, cultureHarmony: number, executiveObservation: number) => {
    return (performanceScore * 0.5) + (cultureHarmony * 10 * 0.3) + (executiveObservation * 10 * 0.2);  // Contribution Score = (Performance Score * 0.5) + (Culture Harmony * 10 * 0.3) + (Executive Observation * 10 * 0.2)
};
export const calculatePotentialScore = (potential: number) => {
    return potential * 20; // Potential Score = Potential * 20
};
export const calculateKeeperScore = (contributionScore: number, potentialScore: number) => {
    return (contributionScore * 0.6) + (potentialScore * 0.4); // Keeper Score = (Contribution Score * 0.6) + (Potential Score * 0.4)
};

// ----------------- Custom Hook ------------------ //
export const useMockData = () => {
    const [evaluations, setEvaluations] = useState<Evaluation[]>(initialEvaluations);
    const [resultsData, setResultsData] = useState<EmployeeResult[]>([]);

    const recentEvaluations = useMemo(() => {   //Returns the last 10 evaluations
        return evaluations.slice(-10).reverse();
    }, [evaluations]);

    const totalEvaluations = recentEvaluations.length;
    const savedEvaluations = recentEvaluations.filter(e => e.submission_status === 'Submitted').length;
    const draftEvaluations = recentEvaluations.filter(e => e.submission_status === 'Draft').length;

    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [categoriesWithSubcategories, setCategoriesWithSubcategories] = useState<CategoryWithSubcategories[]>(initialCategoriesWithSubcategories);
    const [managementSurveys, setManagementSurveys] = useState<Survey[]>([...initialManagementSurveys]);

    useEffect(() => { //It loops through every single employee, and for each one, it performs the score calculations and returns the results.
        const calculatedResults = initialResultsData.map(employee => {
            const performanceScore = calculatePerformanceScore(employee.kpiScore, employee.teamEffect);
            const contributionScore = calculateContributionScore(performanceScore, employee.cultureHarmony, employee.executiveObservation);
            const potentialScore = calculatePotentialScore(employee.potential);
            const keeperScore = calculateKeeperScore(contributionScore, potentialScore);
            return {
                ...employee,
                performanceScore,
                contributionScore,
                potentialScore,
                keeperScore
            };
        });
        setResultsData(calculatedResults);
    }, []);

    // ----------------- Getting the number of surveys submitted for an employee ------------------ //
    const getSurveyCountForEmployee = (employeeName: string) => {   // When counting the surveys, it only counts the surveys that are submitted
        return evaluations.filter(e => e.employeeName === employeeName && (e.submission_status === 'Submitted')).length; // Returns the number of surveys submitted for the employee
    };

    // ----------------- Adding a category ------------------ //
    const addCategory = (newCategoryData: Omit<Category, "id" | "dateAdded">) => {
        const newCategory: Category = {
            id: Math.max(...categories.map((c) => c.id), 0) + 1,
            dateAdded: new Date().toLocaleDateString("en-US"),
            ...newCategoryData,
        };
        setCategories([...categories, newCategory]);
    }

    // ----------------- Updating a category ------------------ //
    const updateCategory = (updatedCategory: Category) => {
        setCategories(categories.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
    }

    // ----------------- Deleting a category ------------------ //
    const deleteCategory = (categoryId: number) => {
        setCategories(categories.filter(cat => cat.id !== categoryId));
    }

    // ----------------- Adding a survey ------------------ //
    const addSurvey = (newSurveyData: Omit<Survey, "id" | "responses">) => {
        const newSurvey: Survey = {
            id: Math.max(0, ...managementSurveys.map((s) => s.id)) + 1,
            responses: 0, // New surveys start with 0 responses
            ...newSurveyData,
            categories: newSurveyData.categories || [], // Ensure categories is always an array
        };
        setManagementSurveys([...managementSurveys, newSurvey]);
    };

    // ----------------- Updating a survey ------------------ //
    const updateSurvey = (updatedSurvey: Survey) => {
        setManagementSurveys(prev => prev.map(s => s.id === updatedSurvey.id ? updatedSurvey : s));
    };

    // ----------------- Deleting a survey ------------------ //
    const deleteSurvey = (surveyId: number) => {
        setManagementSurveys(prev => prev.filter(s => s.id !== surveyId));
    };

    // ----------------- Adding a subcategory ------------------ //
    const addSubcategory = (newSubcategory: Omit<Subcategory, "id" | "dateAdded">, categoryId: number) => {
        const newData = categoriesWithSubcategories.map((category) => {
            if (category.id === categoryId) {
                const newSub = { ...newSubcategory, id: Date.now(), dateAdded: new Date().toLocaleDateString("en-US") };
                return { ...category, subcategories: [...category.subcategories, newSub] };
            }
            return category;
        });
        setCategoriesWithSubcategories(newData);
    }

    // ----------------- Updating a subcategory ------------------ //
    const updateSubcategory = (updatedSubcategory: Subcategory) => {
        const newData = categoriesWithSubcategories.map((category) => {
            const subcategoryIndex = category.subcategories.findIndex((s) => s.id === updatedSubcategory.id);
            if (subcategoryIndex !== -1) {
                const newSubcategories = [...category.subcategories];
                newSubcategories[subcategoryIndex] = updatedSubcategory;
                return { ...category, subcategories: newSubcategories };
            }
            return category;
        });
        setCategoriesWithSubcategories(newData);
    }

    // ----------------- Deleting a subcategory ------------------ //
    const deleteSubcategory = (subcategoryId: number) => {
        const newData = categoriesWithSubcategories.map((category) => ({
            ...category,
            subcategories: category.subcategories.filter((s) => s.id !== subcategoryId),
        }));
        setCategoriesWithSubcategories(newData);
    }

    // ----------------- Sorting surveys ------------------ //
    const sortedSurveys = useMemo(() => {
        return [...mySurveysData].sort((a, b) => {
            const isASubmitted = evaluations.some(e => e.surveyName === a.surveyName && e.submission_status === 'Submitted');
            const isBSubmitted = evaluations.some(e => e.surveyName === b.surveyName && e.submission_status === 'Submitted');

            const getScore = (survey: Survey, isSubmitted: boolean) => {
                const isJoinable = survey.status === 'Active' && !isSubmitted;
                if (isJoinable) return 1;
                if (survey.status === 'Active') return 2;
                return 3;
            };

            const scoreA = getScore(a, isASubmitted);
            const scoreB = getScore(b, isBSubmitted);
            return scoreA - scoreB;
        });
    }, [mySurveysData, evaluations]);

    return {
        user,
        totalEvaluations,
        savedEvaluations,
        draftEvaluations,
        recentEvaluations,
        sortedSurveys,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        categoriesWithSubcategories,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
        managementSurveys,
        addSurvey,
        updateSurvey,
        deleteSurvey,
        employees,
        departments,
        resultsData,
        formatDate,
        getSurveyCountForEmployee,
        evaluations,
        setEvaluations,
    };
}
