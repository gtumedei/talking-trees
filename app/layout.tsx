"use client";

import { createContext, useState, useEffect, ReactNode } from "react";
import "./globals.css";
import { getCurrentUser } from '@service/userServices';
import { UserContextType } from '@service/types/interface_context';
import {UserDb} from '@service/types/interface_db'

// Definisci l'interfaccia per la struttura RAG
interface TreeSectionStructure {
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

interface TreeStructure {
  sections: TreeSectionStructure[];
  metadata: {
    treeName: string;
    totalChunks: number;
    totalWords: number;
    sources: string[];
  };
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
  const [user, setUser] = useState<UserDb>({} as UserDb);
  const [authLoading, setAuthLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<any>(null);
  const [history, setHistory] = useState<Event[]>([]);
  const [document, setDocument] = useState<TreeStructure | null>(null);
  const [idSpacevector, setIdSpacevector] = useState<string>('');
  const [mainroute, setMainroute] = useState<string>(''); // inizializza come stringa vuota

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

    // Setta la mainroute usando window.location
    if (typeof window !== "undefined") {
      setMainroute(window.location.pathname + window.location.search);
    }

  }, []); // Usa il router quando cambia la path

  const contextValue: UserContextType = {
    userTree, setUserTree,
    userSpecies, setUserSpecies,
    user, setUser,
    userCoords, setUserCoords,
    authLoading,
    history, setHistory,
    document, setDocument,
    idSpacevector, setIdSpacevector,
    mainroute // Passiamo la mainroute al contesto
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
