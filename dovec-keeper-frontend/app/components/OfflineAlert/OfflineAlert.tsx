"use client";

import { useState, useEffect } from 'react';
import './OfflineAlert.css';

export function OfflineAlert() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        // This ensures the code only runs in the browser
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            }
        };
    }, []);

    if (isOnline) {
        return null; // Don't render anything if online
    }

    return (
        <div className="offline-alert">
            You are currently offline. Please check your internet connection.
        </div>
    );
}
