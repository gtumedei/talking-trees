"use client";

import React, { createContext, useState } from "react";
import "./globals.css";

// Creiamo il contesto e lo esportiamo
export const UserContext = createContext(null);

export default function RootLayout({ children }) {
  const [userTree, setUserTree] = useState(null);
  const [userSpecies, setUserSpecies] = useState(null);
  const [chatbotInitialized, setChatbotInitialized] = useState(false);

  return (
    <html lang="it">
      <body>
        <UserContext.Provider value={{
          userTree, setUserTree,
          userSpecies, setUserSpecies,
          chatbotInitialized, setChatbotInitialized
        }}>
          {children}
        </UserContext.Provider>
      </body>
    </html>
  );
}

