import { useState, useEffect, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import api from '../../utils/api';
import { EmployeeResult } from '../../types/employee';
import './specificEmployeeDetails.css';

interface SpecificEmployeeDetailsProps {
    employeeId: string; // Core identifier - everything else is fetched by this ID
    isModal?: boolean;
    onClose?: () => void;
}

export default function SpecificEmployeeDetails({ 
    employeeId,
    isModal = false, 
    onClose
}: SpecificEmployeeDetailsProps) {
    const { user, token } = useUser();

    // Core data fetched by employeeId
    const [employee, setEmployee] = useState<EmployeeResult | null>(null);
    const [surveyCount, setSurveyCount] = useState<number>(0);
    const [userKpi, setUserKpi] = useState<number | undefined>(undefined);

    // Local KPI edit state
    const [isEditingKpi, setIsEditingKpi] = useState(false);
    const [editedKpi, setEditedKpi] = useState<number>(0);
    const [kpiError, setKpiError] = useState<string>('');
    const [isSavingKpi, setIsSavingKpi] = useState(false);

    // Loading / error state for initial fetch
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string>('');

    const normalizeEmployeeId = (rawId: string) => {
        if (!rawId) return '';
        const idString = rawId.toString();
        // If it's a composite key (employeeId_surveyId), extract just the employeeId
        if (idString.includes('_')) {
            const baseId = idString.split('_')[0];
            return baseId;
        }
        return idString;
    };

    const normalizedEmployeeId = useMemo(
        () => normalizeEmployeeId(employeeId),
        [employeeId]
    );

    // Fetch user, results and survey count by employeeId
    useEffect(() => {
        const fetchEmployeeData = async () => {
            if (!normalizedEmployeeId || !token) {
                setEmployee(null);
                setSurveyCount(0);
                setUserKpi(undefined);
                return;
            }

            setIsLoading(true);
            setLoadError('');

            try {
                // 1) Fetch user data to get name, department and KPI
                const userRes = await api.get(`/users/${normalizedEmployeeId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const userData = userRes.data as any;

                const baseEmployee: EmployeeResult = {
                    _id: userData._id,
                    id: userData.id || userData._id,
                    employeeId: userData._id,
                    employeeName: userData.name,
                    department: userData.department || 'N/A',
                    role: userData.role,
                    date: userData.updatedAt
                        ? new Date(userData.updatedAt).toLocaleDateString()
                        : new Date().toLocaleDateString(),
                    kpiScore: 0,
                    kpi: userData.kpi,
                    potential: 0,
                    cultureHarmony: 0,
                    teamEffect: 0,
                    executiveObservation: 0,
                    performanceScore: 0,
                    contributionScore: 0,
                    potentialScore: 0,
                    keeperScore: 0,
                    managerFormAverage: 0,
                    teammateFormAverage: 0,
                };

                setUserKpi(userData.kpi);
                setEmployee(baseEmployee);

                // 2) Fetch calculated results for this employee
                try {
                    const idsToTry: string[] = [
                        normalizedEmployeeId,
                        userData._id,
                        userData.id,
                    ]
                        .filter((id) => id != null)
                        .map((id) => String(id))
                        .filter((id, index, arr) => arr.indexOf(id) === index);

                    let resultsRes: { data: EmployeeResult } | null = null;
                    let lastError: any = null;
                    let found404 = false;

                    for (const id of idsToTry) {
                        if (!id) continue;
                        try {
                            const res = await api.get<EmployeeResult>(`/results/${id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            resultsRes = res;
                            break;
                        } catch (err: any) {
                            lastError = err;
                            const status = err.response?.status;

                            if (status === 404) {
                                found404 = true;
                                break;
                            }
                        }
                    }

                    if (resultsRes) {
                        const resultsData = resultsRes.data;
                        setEmployee((prev) => {
                            const current = prev || baseEmployee;
                            return {
                                ...current,
                                ...resultsData,
                                employeeName: resultsData.employeeName || current.employeeName,
                                department: resultsData.department || current.department,
                            };
                        });
                    } else if (!found404 && lastError) {
                        console.error('❌ Unexpected error fetching employee results:', lastError);
                    }
                } catch (resultsErr: any) {
                    console.error('❌ Error fetching employee results:', resultsErr);
                }

                // 3) Fetch survey count separately
                try {
                    const responsesRes = await api.get('/responses', {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    const idsForResponses = [
                        normalizedEmployeeId,
                        userData._id?.toString(),
                        userData.id?.toString(),
                    ].filter(Boolean);

                    const submittedCount = responsesRes.data.filter((r: any) => {
                        const empId = r.employee?._id?.toString() || r.employee?.toString() || r.employee;
                        return idsForResponses.includes(empId) && r.status === 'submitted';
                    }).length;

                    setSurveyCount(submittedCount);
                } catch (err) {
                    console.error('❌ Error fetching survey responses:', err);
                    setSurveyCount(0);
                }

                // Initialize KPI edit value
                const initialKpi = userData.kpi ?? employee?.kpiScore ?? 0;
                setEditedKpi(initialKpi || 0);
            } catch (err: any) {
                console.error('❌ Error loading employee details:', err);
                const status = err.response?.status;
                if (status === 404) {
                    setLoadError('User not found.');
                } else if (status === 403) {
                    setLoadError("You don't have permission to view this user.");
                } else {
                    setLoadError(err.response?.data?.message || err.message || 'Failed to load employee details.');
                }
                setEmployee(null);
                setSurveyCount(0);
                setUserKpi(undefined);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmployeeData();
    }, [normalizedEmployeeId, token]);

    // Update editedKpi when userKpi changes (e.g., after refresh)
    useEffect(() => {
        const currentKpi = userKpi !== undefined ? userKpi : (employee?.kpiScore || 0);
        if (!isEditingKpi) {
            setEditedKpi(currentKpi);
        }
    }, [userKpi, employee?.kpiScore, isEditingKpi]);

    const handleSaveKpi = async () => {
        // Check if employeeId is available
        if (!normalizedEmployeeId) {
            setKpiError('Employee ID is missing. Cannot update KPI.');
            return;
        }
        
        if (!token) {
            setKpiError('Authentication token is missing.');
            return;
        }
        
        if (user?.role !== 'admin') {
            setKpiError('Only admins can update KPI');
            return;
        }

        setIsSavingKpi(true);
        setKpiError('');
        
        try {
            // Update KPI in database using normalized employeeId
            const response = await api.put(`/users/${normalizedEmployeeId}`, { kpi: editedKpi }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Verify the KPI was actually saved
            if (response.data.kpi !== editedKpi) {
                console.warn('⚠️ KPI value mismatch! Expected:', editedKpi, 'Got:', response.data.kpi);
            }

            const newKpi = response.data.kpi;
            setUserKpi(newKpi);
            setEditedKpi(newKpi || 0);
            setEmployee(prev => prev ? { ...prev, kpi: newKpi, kpiScore: newKpi } : prev);
            
            // Optionally refetch results so calculated scores use the new KPI
            try {
                const resultsRes = await api.get<EmployeeResult>(`/results/${normalizedEmployeeId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setEmployee(prev => {
                    const current = prev || resultsRes.data;
                    return {
                        ...current,
                        ...resultsRes.data,
                    };
                });
            } catch (resultsErr: any) {
                if (resultsErr.response?.status !== 404) {
                    console.error('❌ Error fetching results after KPI update:', resultsErr);
                }
            }
            
            setIsEditingKpi(false);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update KPI';
            setKpiError(errorMessage);
            // Don't close edit mode on error so user can try again
        } finally {
            setIsSavingKpi(false);
        }
    };

    const handleCancelEditKpi = () => {
        const fallbackKpi = userKpi !== undefined ? userKpi : (employee?.kpiScore || 0);
        setEditedKpi(fallbackKpi);
        setIsEditingKpi(false);
        setKpiError('');
    };

    const currentKpi = userKpi !== undefined ? userKpi : (employee?.kpiScore || 0);

    if (isLoading) {
        return (
            <div className="employee-details-container">
                <div className="details-header">
                    <div className="header-info">
                        <h2>Loading employee details...</h2>
                    </div>
                    {onClose && <button onClick={onClose} className="close-button">&times;</button>}
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="employee-details-container">
                <div className="details-header">
                    <div className="header-info">
                        <h2>Employee Details</h2>
                    </div>
                    {onClose && <button onClick={onClose} className="close-button">&times;</button>}
                </div>
                <div className="user-detail-form">
                    <p style={{ color: '#b91c1c' }}>{loadError}</p>
                </div>
            </div>
        );
    }

    if (!employee) {
        return null;
    }

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
                    {user?.role === 'admin' && !isEditingKpi ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="text" value={currentKpi.toFixed(1)} readOnly style={{ flex: 1 }} />
                            <button 
                                        onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsEditingKpi(true);
                                    }} 
                                className="btn btn-light btn-sm" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            >
                                ✏️ Edit
                            </button>
                        </div>
                    ) : user?.role === 'admin' && isEditingKpi ? (
                        <div>
                            <input
                                type="number"
                                step="0.1"
                                value={editedKpi}
                                onChange={(e) => {
                                    const newValue = parseFloat(e.target.value) || 0;
                                    setEditedKpi(newValue);
                                }}
                                className="kpi-edit-input"
                                style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
                                autoFocus
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSaveKpi();
                                    }} 
                                    className="btn btn-success btn-sm"
                                    disabled={isSavingKpi}
                                >
                                    {isSavingKpi ? 'Saving...' : 'Save'}
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleCancelEditKpi();
                                    }} 
                                    className="btn btn-light btn-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                            {kpiError && <p className="error-message" style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{kpiError}</p>}
                        </div>
                    ) : (
                        <input type="text" value={currentKpi.toFixed(1)} readOnly />
                    )}
                </div>
            </div>
            <h3 className="score-group-header" style={{ marginTop: '1rem' }}>Calculated Scores (Keeper)</h3>
            <div className="scores-grid">
                <div className="form-group"><label>Potential</label><input type="text" value={employee.potential?.toFixed(1) || '0.0'} readOnly /></div>
                <div className="form-group"><label>Culture Harmony</label><input type="text" value={employee.cultureHarmony?.toFixed(1) || '0.0'} readOnly /></div>
                <div className="form-group"><label>Team Effect</label><input type="text" value={employee.teamEffect?.toFixed(1) || '0.0'} readOnly /></div>
                <div className="form-group"><label>Executive Observation</label><input type="text" value={employee.executiveObservation?.toFixed(1) || '0.0'} readOnly /></div>
                <div className="form-group"><label>Performance Score</label><input type="text" value={employee.performanceScore?.toFixed(1) || '0.0'} readOnly /></div>
                <div className="form-group"><label>Contribution Score</label><input type="text" value={employee.contributionScore?.toFixed(1) || '0.0'} readOnly /></div>
                <div className="form-group"><label>Potential Score</label><input type="text" value={employee.potentialScore?.toFixed(1) || '0.0'} readOnly /></div>
                <div className="form-group"><label>Keeper Score</label><input type="text" value={employee.keeperScore?.toFixed(1) || '0.0'} readOnly /></div>
            </div>

            {user?.role === 'admin' && (
                <>
                    {employee.role === 'manager' && (
                        <>
                            <h3 className="score-group-header" style={{ marginTop: '1rem' }}>Manager Evaluation (Yönetici Forms)</h3>
                            <div className="scores-grid">
                                <div className="form-group">
                                    <label>Yönetici Form Average</label>
                                    <input
                                        type="text"
                                        value={(employee.managerFormAverage ?? 0).toFixed(1)}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    {employee.role === 'employee' && (
                        <>
                            <h3 className="score-group-header" style={{ marginTop: '1rem' }}>Teammate Evaluation (Takım Arkadaşı Forms)</h3>
                            <div className="scores-grid">
                                <div className="form-group">
                                    <label>Takım Arkadaşı Form Average</label>
                                    <input
                                        type="text"
                                        value={(employee.teammateFormAverage ?? 0).toFixed(1)}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );

    // Content for the container (Users page)
    const pageContent = (
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
                    <tr>
                        <td>KPI Score</td>
                        <td>
                            {user?.role === 'admin' && !isEditingKpi ? (
                                <span>
                                    {currentKpi.toFixed(1)}
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsEditingKpi(true);
                                        }} 
                                        className="edit-kpi-btn" 
                                        style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                                    >
                                        ✏️
                                    </button>
                                </span>
                            ) : user?.role === 'admin' && isEditingKpi ? (
                                <div className="kpi-edit-controls">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={editedKpi}
                                        onChange={(e) => {
                                            const newValue = parseFloat(e.target.value) || 0;
                                            setEditedKpi(newValue);
                                        }}
                                        className="kpi-edit-input"
                                        style={{ width: '80px', marginRight: '0.5rem', padding: '0.25rem' }}
                                        autoFocus
                                    />
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSaveKpi();
                                        }} 
                                        className="btn btn-success btn-sm" 
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                                        disabled={isSavingKpi}
                                    >
                                        {isSavingKpi ? 'Saving...' : 'Save'}
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleCancelEditKpi();
                                        }} 
                                        className="btn btn-light btn-sm" 
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                                    >
                                        Cancel
                                    </button>
                                    {kpiError && <p className="error-message" style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{kpiError}</p>}
                                </div>
                            ) : (
                                <span>{currentKpi.toFixed(1)}</span>
                            )}
                        </td>
                    </tr>
                    
                    {/* The following rows are for the calculated scores */}
                    <tr><td colSpan={2} className="score-group-header">Calculated Scores</td></tr>
                    <tr><td>Performance Score</td><td>{employee.performanceScore?.toFixed(1) || '0.0'}</td></tr>
                    <tr><td>Contribution Score</td><td>{employee.contributionScore?.toFixed(1) || '0.0'}</td></tr>
                    <tr><td>Potential Score</td><td>{employee.potentialScore?.toFixed(1) || '0.0'}</td></tr>
                    <tr><td>Keeper Score</td><td>{employee.keeperScore?.toFixed(1) || '0.0'}</td></tr>

                    {/* The following rows are for the survey average scores */}
                    <tr><td colSpan={2} className="score-group-header">Survey Average Scores (Keeper)</td></tr>
                    <tr><td>Potential</td><td>{employee.potential?.toFixed(1) || '0.0'}</td></tr>
                    <tr><td>Culture Harmony</td><td>{employee.cultureHarmony?.toFixed(1) || '0.0'}</td></tr>
                    <tr><td>Team Effect</td><td>{employee.teamEffect?.toFixed(1) || '0.0'}</td></tr>
                    <tr><td>Executive Observation</td><td>{employee.executiveObservation?.toFixed(1) || '0.0'}</td></tr>

                    {/* Extra sections for manager / teammate forms (admin only) */}
                    {user?.role === 'admin' && employee.role === 'manager' && (
                        <>
                            <tr><td colSpan={2} className="score-group-header">Manager Evaluation (Yönetici Forms)</td></tr>
                            <tr>
                                <td>Yönetici Form Average</td>
                                <td>{(employee.managerFormAverage ?? 0).toFixed(1)}</td>
                            </tr>
                        </>
                    )}
                    {user?.role === 'admin' && employee.role === 'employee' && (
                        <>
                            <tr><td colSpan={2} className="score-group-header">Teammate Evaluation (Takım Arkadaşı Forms)</td></tr>
                            <tr>
                                <td>Takım Arkadaşı Form Average</td>
                                <td>{(employee.teammateFormAverage ?? 0).toFixed(1)}</td>
                            </tr>
                        </>
                    )}
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
                    <img src={(employee as any).profilePicture} alt={`${employee.employeeName}'s profile`} className="profile-picture" />
                    <h2>{employee.employeeName}'s Details</h2>
                </div>
                {onClose && <button onClick={onClose} className="close-button">&times;</button>}
            </div>
            {pageContent}
        </div>
    );
}
