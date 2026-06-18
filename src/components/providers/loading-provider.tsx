'use client';

import { createContext, useContext, useState } from 'react';

interface LoadingContextType {
    isColdStart: boolean;
    setIsColdStart: (value: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [isColdStart, setIsColdStart] = useState(false);

    return (
        <LoadingContext.Provider value={{ isColdStart, setIsColdStart }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}
