"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useMockData, Survey } from '../hooks/useMockData';
import SurveyForm from './surveyForm';
import '../components/buttons.css';

function SurveyPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { sortedSurveys } = useMockData();
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    //--------------Survey Form Loading--------------------------
    useEffect(() => {
        const surveySlug = searchParams.get('survey');
        if (surveySlug && sortedSurveys.length > 0) {
            const foundSurvey = sortedSurveys.find(s => (s.surveyName) === surveySlug);
            if (foundSurvey) {
                setSurvey(foundSurvey);
            } else {
                router.push('/');
            }
        }
    }, [searchParams, sortedSurveys, router]);

    //--------------Survey Form Submission--------------------------
    const handleFormSubmit = ( // API will be called to save the survey response
        submittedSurvey: Survey,
        status: "Submitted" | "Draft",
    ) => {
        if (status === 'Submitted') {   // Record the name of the submitted survey in session storage
            sessionStorage.setItem('justSubmittedSurvey', submittedSurvey.surveyName);
            setIsSubmitted(true);
        } else {    // For drafts, we can just go back to the dashboard.
            sessionStorage.setItem('notification', 'Survey saved as draft!');   // Save the notification message to the session storage
            router.push('/');
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
    if (!survey) {
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