import { EmployeeResult } from '../../hooks/mockData';
import './specificEmployeeDetails.css';

interface SpecificEmployeeDetailsProps {
    employee: EmployeeResult;
    isModal?: boolean;
    onClose?: () => void;
    surveyCount?: number; //Number of surveys submitted for the employee
}

export default function SpecificEmployeeDetails({ employee, isModal = false, onClose, surveyCount }: SpecificEmployeeDetailsProps) {
    const modalContent = (   //Content for the modal (Results page)
        <div className="user-detail-form">
            <div className="form-row info-row">
                <div className="info-item">
                    <span className="info-label">Department:</span>
                    <span className="info-value">{employee.department}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Date:</span>
                    <span className="info-value">{employee.date}</span>
                </div>
            </div>
            <div className="form-row kpi-row">
                <div className="form-group">
                    <label>KPI Score</label>
                    <input type="text" value={employee.kpiScore} readOnly />
                </div>
            </div>
            <div className="scores-grid">
                <div className="form-group"><label>Potential</label><input type="text" value={employee.potential} readOnly /></div>
                <div className="form-group"><label>Culture Harmony</label><input type="text" value={employee.cultureHarmony} readOnly /></div>
                <div className="form-group"><label>Team Effect</label><input type="text" value={employee.teamEffect} readOnly /></div>
                <div className="form-group"><label>Executive Observation</label><input type="text" value={employee.executiveObservation} readOnly /></div>
                <div className="form-group"><label>Performance Score</label><input type="text" value={employee.performanceScore.toFixed(1)} readOnly /></div>
                <div className="form-group"><label>Contribution Score</label><input type="text" value={employee.contributionScore.toFixed(1)} readOnly /></div>
                <div className="form-group"><label>Potential Score</label><input type="text" value={employee.potentialScore.toFixed(1)} readOnly /></div>
                <div className="form-group"><label>Keeper Score</label><input type="text" value={employee.keeperScore.toFixed(1)} readOnly /></div>
            </div>
        </div>
    );

    const pageContent = ( //Content for the container (Users page)
        <div className="user-detail-form">
            <div className="summary-bar">
                <div className="summary-item">
                    <span className="summary-label">Department</span>
                    <span className="summary-value">{employee.department}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Last Review</span>
                    <span className="summary-value">{employee.date}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Surveys Filled</span>
                    <span className="summary-value">{surveyCount}</span>
                </div>
            </div>
            <table className="scores-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>KPI Score</td><td>{employee.kpiScore}</td></tr>
                    
                    {/* The following rows are for the calculated scores */}
                    <tr><td colSpan={2} className="score-group-header">Calculated Scores</td></tr>
                    <tr><td>Performance Score</td><td>{employee.performanceScore.toFixed(1)}</td></tr>
                    <tr><td>Contribution Score</td><td>{employee.contributionScore.toFixed(1)}</td></tr>
                    <tr><td>Potential Score</td><td>{employee.potentialScore.toFixed(1)}</td></tr>
                    <tr><td>Keeper Score</td><td>{employee.keeperScore.toFixed(1)}</td></tr>

                    {/* The following rows are for the survey average scores */}
                    <tr><td colSpan={2} className="score-group-header">Survey Average Scores</td></tr>
                    <tr><td>Potential</td><td>{employee.potential}</td></tr>
                    <tr><td>Culture Harmony</td><td>{employee.cultureHarmony}</td></tr>
                    <tr><td>Team Effect</td><td>{employee.teamEffect}</td></tr>
                    <tr><td>Executive Observation</td><td>{employee.executiveObservation}</td></tr>
                </tbody>
            </table>
        </div>
    );

    if (isModal) {  //If the modal is open, display the modal which is for the RESULTS page
        return (
            <div className="employee-details-modal-overlay" onClick={onClose}>
                <div className="employee-details-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>{employee.employeeName}'s Details</h2>
                        <button onClick={onClose} className="close-button">&times;</button>
                    </div>
                    {modalContent}
                </div>
            </div>
        );
    }

    return (    //If the modal is not open, display the employee details in the USERS page
        <div className="employee-details-container">
            <div className="details-header">
                <div className="header-info">
                    <img src={employee.profilePicture} alt={`${employee.employeeName}'s profile`} className="profile-picture" />
                    <h2>{employee.employeeName}'s Details</h2>
                </div>
                {onClose && <button onClick={onClose} className="close-button">&times;</button>}
            </div>
            {pageContent}
        </div>
    );
}