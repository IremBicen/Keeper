"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type Role = 'admin' | 'manager';

interface UserContextType {
    role: Role;
    setRole: (role: Role) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<Role>('manager'); // Default role

    useEffect(() => {
        // On component mount, try to get the role from local storage
        const storedRole = localStorage.getItem('userRole');
        if (storedRole === 'admin' || storedRole === 'manager') {
            setRole(storedRole);
        }
    }, []);

    const handleSetRole = (newRole: Role) => {
        // Update state and local storage
        setRole(newRole);
        localStorage.setItem('userRole', newRole);
    };

    return (
        <UserContext.Provider value={{ role, setRole: handleSetRole }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
