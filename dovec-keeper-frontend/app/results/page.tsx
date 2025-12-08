"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from 'xlsx'; // This is the library for exporting the results data to a Excel file
import api from "../utils/api";
import { useUser } from "../context/UserContext";
import { EmployeeResult } from "../types/employee";
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

    // Export to a formatted Excel file using a plain JS function (XLSX library)
    const handleExport = () => {
        // 1. Prepare the data in an array of objects format (use currently filtered results)
        const validData = filteredResults;
        if (validData.length === 0) {
            alert("No data to export");
            return;
        }
        const dataForSheet = validData.map(item => ({
            "Employee Name": item.employeeName,
            "Department": item.department,
            "Survey Name": item.surveyTitle || "Unknown Survey",
            "Date": item.date,
            "Performance Score": item.performanceScore.toFixed(1),
            "Contribution Score": item.contributionScore.toFixed(1),
            "Potential Score": item.potentialScore.toFixed(1),
            "Keeper Score": item.keeperScore.toFixed(1),
            "KPI Score": item.kpiScore,
            "Potential": item.potential,
            "Culture Harmony": item.cultureHarmony,
            "Team Effect": item.teamEffect,
            "Executive Observation": item.executiveObservation,
        }));

        // 2. Create a new workbook and a worksheet
        const ws = XLSX.utils.json_to_sheet(dataForSheet);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Results");

        // 3. Define column widths (simplified)
        // Get the number of columns from the first data row + headers
        const numberOfColumns = Object.keys(dataForSheet[0]).length;
        // Create an array of width objects, all set to 20
        const columnWidths = Array(numberOfColumns).fill({ wch: 20 });
        
        ws["!cols"] = columnWidths;

        // 4. Trigger the download
        XLSX.writeFile(wb, "results.xlsx");
    };

    // ---------------------------------------------

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="dashboard-main">
                <header className="dashboard-header results-header">
                    <h1 className="dashboard-title">Results</h1>
                    <button className="btn btn-light btn-with-icon" onClick={handleExport}>
                        <HiArrowUpOnSquare width={16} height={16} />
                        Export
                    </button>
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