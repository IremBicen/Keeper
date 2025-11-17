"use client";
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '../components/sidebar/Sidebar';
import { useMockData } from '../hooks/useMockData';
import { EmployeeResult } from '../hooks/mockData';
import SpecificEmployeeDetails from './specificEmployeeDetailsForm/specificEmployeeDetails';
import './users.css';
import '../components/table.css';
import '../components/buttons.css';

function UsersPageComponent() {
    const { resultsData, getSurveyCountForEmployee } = useMockData();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResult | null>(null);

    const surveyCount = selectedEmployee ? getSurveyCountForEmployee(selectedEmployee.employeeName) : 0; //Gets the number of surveys submitted for the employee from the useMockData hook

    useEffect(() => {   //  Allows to link directly to a specific employee's details
        const employeeId = searchParams.get('employeeId');
        if (employeeId) {
            const employee = resultsData.find(emp => emp.id.toString() === employeeId);
            setSelectedEmployee(employee || null);
        }
    }, [searchParams, resultsData]);

    // ----------------- Handling the close button ----------------- //
    const handleClose = () => {
        const source = searchParams.get('source');
        if (source === 'results') {
            router.back();  //Go back to the results page
        } else {
            setSelectedEmployee(null); //Stay on the users page and show the table
        }
    };

    //--------------------------------------------------------------//

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="dashboard-main users-main">
                <header className="users-header">
                    <h1 className="users-title">Users</h1>
                </header>
                
                {selectedEmployee ? ( // If there is a selected employee, display the specific employee details
                    <SpecificEmployeeDetails employee={selectedEmployee} isModal={false} onClose={handleClose} surveyCount={surveyCount} />
                ) : ( // If there is no selected employee, display the table of users
                    <div className="box-container">
                        <table className="table-container">
                            <thead>
                                <tr>
                                    <th>Employee Name</th>
                                    <th>Department</th>
                                    <th>Last Review</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resultsData.length > 0 ? ( // If there are users, display the users in the table
                                    resultsData.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.employeeName}</td>
                                            <td>{user.department}</td>
                                            <td>{user.date}</td>
                                            <td>
                                                <button onClick={() => {
                                                    setSelectedEmployee(user);
                                                }} className="btn btn-light">
                                                    See Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : ( // If there are no users, display a message
                                    <tr>
                                        <td colSpan={4} className="no-users-message">No users found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function UsersPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <UsersPageComponent />
        </Suspense>
    );
}