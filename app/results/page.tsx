"use client";

import { useState } from 'react';
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx'; // This is the library for exporting the results data to a Excel file
import { Sidebar } from "../components/sidebar/Sidebar";
import "./results.css";
import "../components/table.css";
import "../components/buttons.css";
import { useMockData } from "../hooks/useMockData";
import { HiArrowUpOnSquare } from "react-icons/hi2";
import SpecificEmployeeDetails from '../users/specificEmployeeDetailsForm/specificEmployeeDetails';
import { EmployeeResult } from '../hooks/mockData';

export default function ResultsPage() {
    const router = useRouter();
    const { resultsData } = useMockData();
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResult | null>(null);

    const handleViewClick = (employee: EmployeeResult) => {
        setSelectedEmployee(employee);
    };

    const handleCloseModal = () => {
        setSelectedEmployee(null);
    };

    // Export to a formatted Excel file using a plain JS function (XLSX library)
    const handleExport = () => {
        // 1. Prepare the data in an array of objects format
        const dataForSheet = resultsData.map(item => ({
            "Employee Name": item.employeeName,
            "Department": item.department,
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
                    <table className="table-container">
                        <thead>
                            <tr>
                                <th>Employee Name</th>
                                <th>Department</th>
                                <th>Date</th>
                                <th>Performance Score</th>
                                <th>Contribution Score</th>
                                <th>Potential Score</th>
                                <th>Keeper Score</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resultsData.map((result) => (
                                <tr key={result.id}>
                                    <td>{result.employeeName}</td>
                                    <td>{result.department}</td>
                                    <td>{result.date}</td>
                                    <td>{result.performanceScore.toFixed(1)}</td>
                                    <td>{result.contributionScore.toFixed(1)}</td>
                                    <td>{result.potentialScore.toFixed(1)}</td>
                                    <td>{result.keeperScore.toFixed(1)}</td>
                                    <td className="action-cell">
                                        <button className="btn btn-secondary" onClick={() => handleViewClick(result)}>View</button>
                                        <button className="btn btn-light" onClick={() => router.push(`/users?employeeId=${result.id}&source=results`)}>User Profile</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* If an employee is selected, display the specific employee details */}
                {selectedEmployee && (
                    <SpecificEmployeeDetails 
                        employee={selectedEmployee}
                        onClose={handleCloseModal}
                        isModal={true}  //This is to indicate that this is a modal (Results page)
                    />
                )}
            </main>
        </div>
    );
}