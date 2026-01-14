"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from 'xlsx'; // This is the library for exporting the results data to a Excel file
import api from "../utils/api";
import { useUser } from "../context/UserContext";
import { EmployeeResult } from "../types/employee";
import { Category } from "../types/category";
import { Subcategory } from "../types/subcategory";
import { Sidebar } from "../components/sidebar/Sidebar";
import "./results.css";
import "../components/table.css";
import "../components/buttons.css";
import { HiArrowUpOnSquare } from "react-icons/hi2";
import SpecificEmployeeDetails from '../users/specificEmployeeDetailsForm/specificEmployeeDetails';
import SurveyAnswersView from './SurveyAnswersView';

function ResultsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { token } = useUser();
    const [resultsData, setResultsData] = useState<EmployeeResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResult | null>(null);
    const [selectedEmployeeAggregated, setSelectedEmployeeAggregated] = useState<EmployeeResult | null>(null);
    const [loadingEmployeeDetails, setLoadingEmployeeDetails] = useState(false);
    const [showAnswersView, setShowAnswersView] = useState(false);
    const [selectedResultForAnswers, setSelectedResultForAnswers] = useState<EmployeeResult | null>(null);
    const [selectedEmployeeKpi, setSelectedEmployeeKpi] = useState<number | undefined>(undefined);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(undefined);
    const [departmentFilter, setDepartmentFilter] = useState<string>('');
    const [surveyFilter, setSurveyFilter] = useState<string>('');
    const [selectedName, setSelectedName] = useState<string>('');

    // Fetch results from backend
    useEffect(() => {
        const fetchResults = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const res = await api.get<EmployeeResult[]>("/results", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                // Filter out any null or invalid results
                const validResults = (res.data || []).filter((result: any) => {
                    if (!result) return false;
                    // Check if result has required fields
                    if (!result._id && !result.id) return false;
                    // Check if employeeName exists (required for display)
                    if (!result.employeeName) return false;
                    // Check if scores are valid numbers
                    if (typeof result.performanceScore !== 'number' || isNaN(result.performanceScore)) return false;
                    return true;
                });
                setResultsData(validResults);
            } catch (err) {
                console.error("Error fetching results:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [token]);

    // Refresh results when navigating back from users page (check for refresh param)
    useEffect(() => {
        const refresh = searchParams.get('refresh');
        if (refresh === 'true' && token) {
            // Refetch results when coming back from users page (KPI might have been updated)
            const fetchResults = async () => {
                try {
                    setLoading(true);
                    const res = await api.get<EmployeeResult[]>("/results", {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const validResults = (res.data || []).filter((result: any) => {
                        if (!result) return false;
                        if (!result._id && !result.id) return false;
                        if (!result.employeeName) return false;
                        if (typeof result.performanceScore !== 'number' || isNaN(result.performanceScore)) return false;
                        return true;
                    });
                    setResultsData(validResults);
                    // Remove refresh param from URL
                    router.replace('/results', { scroll: false });
                } catch (err) {
                    console.error("Error refreshing results:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchResults();
        }
    }, [searchParams, token, router]);

    const handleViewClick = async (result: EmployeeResult) => {
        // Check if this is a keeper survey
        const surveyTitle = result.surveyTitle?.toLowerCase() || '';
        const isKeeperSurvey = surveyTitle.includes('keeper');
        
        if (isKeeperSurvey) {
            // For keeper surveys, fetch aggregated results for this employee
            // This ensures we show all their survey data, not just one survey
            try {
                setLoadingEmployeeDetails(true);
                // IMPORTANT: result._id and result.id are composite keys (employeeId_surveyId)
                // We must use result.employeeId to get the actual user ID
                let employeeId = result.employeeId;
                
                // If employeeId is not directly available, try to extract it
                if (!employeeId) {
                    // Check if _id or id is a composite key and extract employeeId
                    const compositeKey = result._id || result.id;
                    if (compositeKey && typeof compositeKey === 'string' && compositeKey.includes('_')) {
                        // Extract employeeId from composite key (format: employeeId_surveyId)
                        employeeId = compositeKey.split('_')[0];
                    } else {
                        // Fallback: ensure we always convert compositeKey to string
                        employeeId = compositeKey?.toString();
                    }
                }
                
                // Normalize to string
                employeeId = employeeId?.toString();
                
                if (!employeeId) {
                    console.error("❌ No employee ID found in result:", result);
                    return;
                }
                
                
                const res = await api.get<EmployeeResult>(`/results/${employeeId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                // Also fetch user data to get KPI
                try {
                    const userRes = await api.get(`/users/${employeeId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setSelectedEmployeeKpi((userRes.data as any)?.kpi);
                } catch (err) {
                    console.error("❌ Error fetching user KPI:", err);
                }
                
                setSelectedEmployeeAggregated(res.data);
                setSelectedEmployeeId(employeeId);
                setSelectedEmployee(null); // Clear single result
                setShowAnswersView(false);
            } catch (err: any) {
                console.error("Error fetching employee aggregated results:", err);
                // Fallback to showing the single result if fetch fails
                setSelectedEmployee(result);
                setSelectedEmployeeAggregated(null);
            } finally {
                setLoadingEmployeeDetails(false);
            }
        } else {
            // Show answers for other surveys (yönetici, takım arkadaşı, etc.)
            setSelectedResultForAnswers(result);
            setShowAnswersView(true);
            setSelectedEmployee(null);
            setSelectedEmployeeAggregated(null);
        }
    };

    const handleCloseModal = () => {
        setSelectedEmployee(null);
        setSelectedEmployeeAggregated(null);
        setSelectedEmployeeKpi(undefined);
        setSelectedEmployeeId(undefined);
    };

    // Derived lists for filters
    const departmentOptions = Array.from(
        new Set(
            resultsData
                .filter((item) => item && item.department)
                .map((item) => item.department as string)
        )
    ).sort();

    const surveyOptions = Array.from(
        new Set(
            resultsData
                .filter((item) => item && item.surveyTitle)
                .map((item) => (item.surveyTitle || 'Unknown Survey') as string)
        )
    ).sort();

    const nameOptions = Array.from(
        new Set(
            resultsData
                .filter((item) => item && item.employeeName)
                .filter((item) => !departmentFilter || item.department === departmentFilter)
                .map((item) => item.employeeName as string)
        )
    ).sort();

    // Apply filters + search
    const filteredResults = resultsData
        .filter((result) => result && (result._id || result.id))
        .filter((result) => {
            if (departmentFilter && result.department !== departmentFilter) return false;
            if (surveyFilter && (result.surveyTitle || 'Unknown Survey') !== surveyFilter) return false;
            if (selectedName && result.employeeName !== selectedName) return false;
            return true;
        });

    // Export detailed results: one row per response, one column per question
    const handleExportDetailed = async () => {
        if (!token) {
            alert("You must be logged in to export results.");
            return;
        }

        // DEBUG: make it 100% clear which export code is running in the browser
        alert("Exporting detailed results (v2) – this is the NEW export.");

        try {
            // 1. Fetch all responses (admins will receive all; others only their own)
            const [responsesRes, categoriesRes] = await Promise.all([
                api.get("/responses", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get<Category[]>("/categories", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            const allResponses: any[] = Array.isArray(responsesRes.data)
                ? responsesRes.data
                : [];

            if (allResponses.length === 0) {
                alert("No responses found to export.");
                return;
            }

            const categories = categoriesRes.data || [];

            // 2. Fetch subcategories for each category to build question labels
            const allSubcategories: Subcategory[] = [];
            for (const category of categories) {
                try {
                    const subsRes = await api.get<Subcategory[]>(
                        `/subcategories/category/${category._id}`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    const subsWithCategory = (subsRes.data || []).map((sub) => ({
                        ...sub,
                        categoryName:
                            (sub.category as any)?.name || category.name,
                    }));
                    allSubcategories.push(...subsWithCategory);
                } catch (err) {
                    console.error(
                        `Error fetching subcategories for category ${category._id}:`,
                        err
                    );
                }
            }

            // 3. Build a map of questionId -> label
            const questionLabelMap = new Map<string, string>();

            // From subcategories (manager / teammate / keeper questions)
            allSubcategories.forEach((sub) => {
                const id = sub._id || sub.id;
                if (!id) return;
                const categoryName =
                    (sub.categoryName ||
                        (typeof sub.category === "object"
                            ? (sub.category as any).name
                            : "")) || "";
                const label = `${categoryName} - ${sub.name}`;
                const key = String(id);
                if (!questionLabelMap.has(key)) {
                    questionLabelMap.set(key, label);
                }
            });

            // Also from survey.questions where available (e.g. keeper surveys)
            allResponses.forEach((resp) => {
                const survey = resp.survey || {};
                const surveyTitle =
                    survey.title || survey.surveyName || "Survey";
                const questions: any[] = Array.isArray(survey.questions)
                    ? survey.questions
                    : [];

                questions.forEach((q: any) => {
                    const id = q.id || q._id;
                    if (!id) return;
                    const text = q.text || q.name || "Question";
                    const label = `${surveyTitle} - ${text}`;
                    const key = String(id);
                    if (!questionLabelMap.has(key)) {
                        questionLabelMap.set(key, label);
                    }
                });
            });

            // Stable list of [questionId, label] for column ordering
            const questionEntries = Array.from(questionLabelMap.entries());

            // 4. Build rows: one row per submitted response
            const rows = allResponses
                .filter((resp) => resp && resp.status === "submitted")
                .map((resp) => {
                    const employee = resp.employee || {};
                    const evaluator = resp.evaluator || {};
                    const survey = resp.survey || {};

                    const base: any = {
                        // Helpful debug marker so we can see which export version this file came from
                        "Export Version": "v2-detailed",
                        "Employee Name": employee.name || "",
                        "Employee Email": employee.email || "",
                        "Employee Department": employee.department || "",
                        "Employee Role": employee.role || "",
                        "Survey Title":
                            survey.title || survey.surveyName || "",
                        "Survey Status": survey.status || "",
                        "Evaluator Name": evaluator.name || "",
                        "Evaluator Email": evaluator.email || "",
                        "Evaluator Department": evaluator.department || "",
                        "Evaluator Role": evaluator.role || "",
                        "Submitted At": resp.submittedAt
                            ? new Date(resp.submittedAt).toLocaleDateString()
                            : "",
                    };

                    const answerMap = new Map<string, any>();
                    const answers: any[] = Array.isArray(resp.answers)
                        ? resp.answers
                        : [];
                    answers.forEach((a) => {
                        if (
                            a &&
                            a.questionId !== undefined &&
                            a.questionId !== null
                        ) {
                            const key = String(a.questionId);
                            answerMap.set(key, a.value);
                        }
                    });

                    // Fill each question column
                    questionEntries.forEach(([questionId, label]) => {
                        const value = answerMap.get(questionId);
                        base[label] =
                            value === undefined || value === null ? "" : value;
                    });

                    return base;
                });

            if (rows.length === 0) {
                alert("No submitted responses to export.");
                return;
            }

            // 5. Create workbook and worksheet
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Detailed Results");

            // Optional: set column widths
            const numberOfColumns = Object.keys(rows[0]).length;
            const columnWidths = Array(numberOfColumns).fill({ wch: 25 });
            (ws as any)["!cols"] = columnWidths;

            // Very explicit file name to distinguish from the old summary export
            XLSX.writeFile(wb, "results_detailed_v2.xlsx");
        } catch (err) {
            console.error("Error exporting detailed results:", err);
            alert(
                "Failed to export detailed results. Please try again or contact support."
            );
        }
    };

    // Export summary results: one row per aggregated result (keeper + form averages)
    const handleExportSummary = () => {
        if (!token) {
            alert("You must be logged in to export results.");
            return;
        }

        if (!resultsData || resultsData.length === 0) {
            alert("No results found to export.");
            return;
        }

        const rows = resultsData.map((result) => ({
            "Employee Name": result.employeeName,
            "Department": result.department,
            "Survey Name": result.surveyTitle || "Unknown Survey",
            "Date": result.date,
            "KPI Score": typeof result.kpiScore === "number" ? result.kpiScore.toFixed(1) : "",
            "Performance Score": typeof result.performanceScore === "number" ? result.performanceScore.toFixed(1) : "",
            "Contribution Score": typeof result.contributionScore === "number" ? result.contributionScore.toFixed(1) : "",
            "Potential Score": typeof result.potentialScore === "number" ? result.potentialScore.toFixed(1) : "",
            "Keeper Score": typeof result.keeperScore === "number" ? result.keeperScore.toFixed(1) : "",
            "Manager Form Average": typeof result.managerFormAverage === "number" ? result.managerFormAverage.toFixed(2) : "",
            "Teammate Form Average": typeof result.teammateFormAverage === "number" ? result.teammateFormAverage.toFixed(2) : "",
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Summary Results");

        const numberOfColumns = Object.keys(rows[0]).length;
        const columnWidths = Array(numberOfColumns).fill({ wch: 25 });
        (ws as any)["!cols"] = columnWidths;

        XLSX.writeFile(wb, "results_summary.xlsx");
    };

    // ---------------------------------------------

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="dashboard-main">
                <header className="dashboard-header results-header">
                    <h1 className="dashboard-title">Results</h1>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                            className="btn btn-light btn-with-icon"
                            onClick={handleExportSummary}
                        >
                            <HiArrowUpOnSquare width={16} height={16} />
                            Export Summary
                        </button>
                        <button
                            className="btn btn-light btn-with-icon"
                            onClick={handleExportDetailed}
                        >
                            <HiArrowUpOnSquare width={16} height={16} />
                            Export Results
                        </button>
                    </div>
                </header>
                <div className="box-container">
                    {/* Filters */}
                    <div className="results-filters">
                        <div className="form-group">
                            <label htmlFor="departmentFilter" className="label-text">
                                Department
                            </label>
                            <select
                                id="departmentFilter"
                                className="form-select"
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                            >
                                <option value="">All</option>
                                {departmentOptions.map((dept) => (
                                    <option key={dept} value={dept}>
                                        {dept}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="surveyFilter" className="label-text">
                                Survey Type
                            </label>
                            <select
                                id="surveyFilter"
                                className="form-select"
                                value={surveyFilter}
                                onChange={(e) => setSurveyFilter(e.target.value)}
                            >
                                <option value="">All</option>
                                {surveyOptions.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group results-search-group">
                            <label htmlFor="nameFilter" className="label-text">
                                Employee
                            </label>
                            <select
                                id="nameFilter"
                                className="form-select"
                                value={selectedName}
                                onChange={(e) => setSelectedName(e.target.value)}
                            >
                                <option value="">All</option>
                                {nameOptions.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="results-table-wrapper">
                        <table className="table-container">
                            <thead>
                                <tr>
                                    <th>Employee Name</th>
                                    <th>Department</th>
                                    <th>Survey Name</th>
                                    <th>Date</th>
                                    <th>Performance Score</th>
                                    <th>Contribution Score</th>
                                    <th>Potential Score</th>
                                    <th>Keeper Score</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: "center" }}>Loading...</td>
                                    </tr>
                                ) : filteredResults.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: "center" }}>No results found</td>
                                    </tr>
                                ) : (
                                    filteredResults.map((result) => (
                                        <tr key={result._id || result.id || `result-${Math.random()}`}>
                                            <td>{result.employeeName}</td>
                                            <td>{result.department}</td>
                                            <td>{result.surveyTitle || 'Unknown Survey'}</td>
                                            <td>{result.date}</td>
                                            <td>{result.performanceScore?.toFixed(1) || '0.0'}</td>
                                            <td>{result.contributionScore?.toFixed(1) || '0.0'}</td>
                                            <td>{result.potentialScore?.toFixed(1) || '0.0'}</td>
                                            <td>{result.keeperScore?.toFixed(1) || '0.0'}</td>
                                            <td className="action-cell">
                                                <button className="btn btn-secondary" onClick={() => handleViewClick(result)}>View</button>
                                                <button className="btn btn-light" onClick={() => {
                                                    const employeeId = result.employeeId || result._id || result.id;
                                                    if (!employeeId) return;
                                                    router.push(`/users?employeeId=${employeeId}&source=results`);
                                                }}>User Details</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* If an employee is selected for keeper survey, display the calculated scores */}
                {loadingEmployeeDetails ? (
                    <div className="employee-details-modal-overlay">
                        <div className="employee-details-modal-content" style={{ textAlign: 'center', padding: '2rem' }}>
                            <p>Loading employee details...</p>
                        </div>
                    </div>
                ) : selectedEmployeeId ? (
                    <SpecificEmployeeDetails 
                        employeeId={selectedEmployeeId}
                        onClose={handleCloseModal}
                        isModal={true}  //This is to indicate that this is a modal (Results page)
                    />
                ) : null}

                {/* If showing answers view for non-keeper surveys */}
                {showAnswersView && selectedResultForAnswers && (
                    <SurveyAnswersView
                        surveyId={selectedResultForAnswers.surveyId || ''}
                        employeeId={selectedResultForAnswers.employeeId || selectedResultForAnswers._id || ''}
                        evaluatorId={selectedResultForAnswers.evaluatorId}
                        onClose={() => {
                            setShowAnswersView(false);
                            setSelectedResultForAnswers(null);
                        }}
                    />
                )}
            </main>
        </div>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResultsPageContent />
        </Suspense>
    );
}