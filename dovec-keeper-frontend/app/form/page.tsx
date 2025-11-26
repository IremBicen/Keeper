"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import api from '../utils/api';
import { useUser } from '../context/UserContext';
import { Survey } from '../types/survey';
import SurveyForm from './surveyForm';
import '../components/buttons.css';

function SurveyPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { token, user } = useUser();
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);

    //--------------Survey Form Loading--------------------------
    useEffect(() => {
        const surveyId = searchParams.get('survey');
        if (surveyId && token) {
            const fetchSurvey = async () => {
                try {
                    setLoading(true);
                    // Try by ID first, then by name if needed
                    const res = await api.get<Survey>(`/surveys/${surveyId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setSurvey(res.data);
                } catch (err) {
                    console.error("Error fetching survey:", err);
                    // If ID fails, try fetching all and finding by name
                    try {
                        const allRes = await api.get<Survey[]>("/surveys", {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const found = allRes.data.find(s => 
                            s._id === surveyId || 
                            s.title === surveyId || 
                            s.surveyName === surveyId
                        );
                        if (found) {
                            setSurvey(found);
                        } else {
                            router.push('/');
                        }
                    } catch {
                        router.push('/');
                    }
                } finally {
                    setLoading(false);
                }
            };
            fetchSurvey();
        } else if (!token) {
            router.push('/login');
        }
    }, [searchParams, token, router]);

    //--------------Survey Form Submission--------------------------
    const handleFormSubmit = async (
        submittedSurvey: Survey,
        status: "Submitted" | "Draft",
        answers: any[]
    ) => {
        if (!token || !survey) return;
        
        try {
            if (!user?.id) {
                alert("User information not available. Please log in again.");
                return;
            }
            
            const responseData = {
                survey: survey._id,
                employee: user.id, // Get from user context
                answers: answers,
                status: status === 'Submitted' ? 'submitted' : 'draft'
            };
            
            await api.post("/responses/submit", responseData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (status === 'Submitted') {
                sessionStorage.setItem('justSubmittedSurvey', survey.title || survey.surveyName || '');
                setIsSubmitted(true);
            } else {
                sessionStorage.setItem('notification', 'Survey saved as draft!');
                router.push('/');
            }
        } catch (err: any) {
            console.error("Error submitting survey:", err);
            alert(err.response?.data?.message || "Failed to submit survey. Please try again.");
        }
    };

    //--------------Survey Form Close--------------------------
    const handleClose = () => {
        router.push('/');
    };

    //--------------Success Message--------------------------
    if (isSubmitted) {
        return (
            <div className="success-container-inline">
                <div className="success-box-inline">
                    <h2>Survey Submitted Successfully!</h2>
                    <p>Thank you for your feedback.</p>
                    <button onClick={() => router.push('/')} className="btn btn-success">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    //--------------Loading Survey--------------------------
    if (loading || !survey) {
        return <div>Loading survey...</div>;
    }

    //--------------Survey Form Rendering--------------------------
    return (
        <div>
            <SurveyForm
                survey={survey}
                onClose={handleClose}
                onSubmit={handleFormSubmit}
            />
        </div>
    );
}

export default function SurveyPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SurveyPageContent />
        </Suspense>
    );
}