import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type UserRole = 'healthWorker' | 'admin' | 'patient' | null;

export interface AppUser {
  uid: string;
  phone?: string;
  name?: string;
  role: UserRole;
  subCenter?: string;
  district?: string;
  village?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: 'male' | 'female' | 'other';
  occupation: string;
  village: string;
  block: string;
  district: string;
  contact?: string;
  registeredBy: string;
  entrySource: 'healthWorker' | 'patient';
  consentGiven: boolean;
  createdAt: Date;
}

export type ConnectivityState = 'online' | 'offline' | 'syncing';

interface AppContextType {
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  currentPatient: Patient | null;
  setCurrentPatient: (patient: Patient | null) => void;
  connectivity: ConnectivityState;
  language: string;
  setLanguage: (lang: string) => void;
  clearSession: () => void;
}

const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  currentPatient: null,
  setCurrentPatient: () => {},
  connectivity: 'online',
  language: 'English',
  setLanguage: () => {},
  clearSession: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [connectivity, setConnectivity] = useState<ConnectivityState>('online');
  const [language, setLanguage] = useState<string>('English');

  useEffect(() => {
    const handleOnline = () => setConnectivity('online');
    const handleOffline = () => setConnectivity('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setConnectivity(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setCurrentPatient(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        currentPatient,
        setCurrentPatient,
        connectivity,
        language,
        setLanguage,
        clearSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
