"use client";

import { useState, useEffect } from 'react';
import { HiSun, HiMoon } from 'react-icons/hi2';
import './ThemeToggleButton.css';

export function ThemeToggleButton() {
    const [theme, setTheme] = useState('light');

    // Effect to set the initial theme from localStorage or system preference
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const initialTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            setTheme(initialTheme);
            if (initialTheme === 'dark') {
                document.documentElement.classList.add('dark');
            }
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <button onClick={toggleTheme} className="theme-toggle-button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? <HiMoon size={20} /> : <HiSun size={20} />}
        </button>
    );
}
