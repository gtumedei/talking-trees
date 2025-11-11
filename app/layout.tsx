"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import "./globals.css";
import { getCurrentUser } from '@service/userService';

// Definisci l'interfaccia per la struttura RAG
interface RAGSection {
  id: string;
  type: string;
  content: string;
  tags: string[];
  metadata: {
    source: string;
    wordCount: number;
    confidence?: number;
    temporalContext?: string;
  };
}

interface RAGStructure {
  sections: RAGSection[];
  metadata: {
    treeName: string;
    totalChunks: number;
    totalWords: number;
    sources: string[];
  };
}

// Definisci l'interfaccia per il contesto
interface UserContextType {
  userTree: any;
  setUserTree: (tree: any) => void;
  userSpecies: any;
  setUserSpecies: (species: any) => void;
  user: any;
  setUser: (user: any) => void;
  userCoords: any;
  setUserCoords: (coords: any) => void;
  authLoading: boolean;
  history: Event[];
  setHistory: (events: Event[]) => void;
  document: RAGStructure | null; // Ora è una struttura RAG
  setDocument: (doc: RAGStructure | null) => void;
  idSpacevector: string;
  setIdSpacevector:(id: string)=> void
}

type Event = {
  year: number;
  text: string;
  category: string;
};

// Definisci le props per il layout
interface RootLayoutProps {
  children: ReactNode;
}

// Crea il contesto con tipo
export const UserContext = createContext<UserContextType | undefined>(undefined);

export default function RootLayout({ children }: RootLayoutProps) {
  const [userTree, setUserTree] = useState<any>(null);
  const [userSpecies, setUserSpecies] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<any>(null);
  const [history, setHistory] = useState<Event[]>([]);
  const [document, setDocument] = useState<RAGStructure | null>(null);
  const [idSpacevector, setIdSpacevector] = useState<string>('');

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
    user, setUser,
    userCoords, setUserCoords,
    authLoading,
    history, setHistory,
    document, setDocument,
    idSpacevector, setIdSpacevector,
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