"use client";

import React, { createContext, useState, useEffect } from "react";
import "./globals.css";
import { checkUserCredentials, getCurrentUser } from './services/userService';

export const UserContext = createContext(null);

export default function RootLayout({ children }) {
  const [userTree, setUserTree] = useState(null);
  const [userSpecies, setUserSpecies] = useState(null);
  const [chatbotInitialized, setChatbotInitialized] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    // Verifica se c'è un utente loggato nel sessionStorage
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

  return (
    <html lang="it">
      <body>
        <UserContext.Provider value={{
          userTree, setUserTree,
          userSpecies, setUserSpecies,
          chatbotInitialized, setChatbotInitialized,
          user, setUser,
          userCoords, setUserCoords,
          authLoading
        }}>
          {children}
        </UserContext.Provider>
      </body>
    </html>
  );
}