"use client";

import React, { createContext, useState, useEffect } from "react";
import "./globals.css";

export const UserContext = createContext(null);

export default function RootLayout({ children }) {
  const [userTree, setUserTree] = useState(null);
  const [userSpecies, setUserSpecies] = useState(null);

  return (
    <html lang="it">
      <body>
        <UserContext.Provider value={{
          userTree, setUserTree,
          userSpecies, setUserSpecies,
        }}>
          {children}
        </UserContext.Provider>
      </body>
    </html>
  );
}







/*"use client";

import React, { createContext, useState, useEffect } from "react";
import "./globals.css";
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const UserContext = createContext(null);

export default function RootLayout({ children }) {
  const [userTree, setUserTree] = useState(null);
  const [userSpecies, setUserSpecies] = useState(null);
  const [chatbotInitialized, setChatbotInitialized] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <html lang="it">
      <body>
        <UserContext.Provider value={{
          userTree, setUserTree,
          userSpecies, setUserSpecies,
          chatbotInitialized, setChatbotInitialized,
          user, setUser,
          authLoading
        }}>
          {children}
        </UserContext.Provider>
      </body>
    </html>
  );
}*/