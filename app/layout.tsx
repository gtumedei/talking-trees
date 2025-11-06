"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import "./globals.css";
import { getCurrentUser } from '@service/userService';

// Definisci l'interfaccia per il contesto
interface UserContextType {
  userTree: any;
  setUserTree: (tree: any) => void;
  userSpecies: any;
  setUserSpecies: (species: any) => void;
  chatbotInitialized: boolean;
  setChatbotInitialized: (initialized: boolean) => void;
  user: any;
  setUser: (user: any) => void;
  userCoords: any;
  setUserCoords: (coords: any) => void;
  authLoading: boolean;
}

// Definisci le props per il layout
interface RootLayoutProps {
  children: ReactNode;
}

// Crea il contesto con tipo
export const UserContext = createContext<UserContextType | undefined>(undefined);

export default function RootLayout({ children }: RootLayoutProps) {
  const [userTree, setUserTree] = useState<any>(null);
  const [userSpecies, setUserSpecies] = useState<any>(null);
  const [chatbotInitialized, setChatbotInitialized] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<any>(null);

  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Errore nel controllo utente:', error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkLoggedInUser();
  }, []);

  const contextValue: UserContextType = {
    userTree, setUserTree,
    userSpecies, setUserSpecies,
    chatbotInitialized, setChatbotInitialized,
    user, setUser,
    userCoords, setUserCoords,
    authLoading
  };

  return (
    <html lang="it">
      <body>
        <UserContext.Provider value={contextValue}>
          {children}
        </UserContext.Provider>
      </body>
    </html>
  );
}