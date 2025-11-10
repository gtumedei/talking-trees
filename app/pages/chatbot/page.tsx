"use client";

import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import styles from './Chatbot.module.css';
import { Button, Badge, Form } from "react-bootstrap"; 
import BackButton from "@/app/component/ui/BackButton";
import { UserContext } from "@/app/layout";

type Source = {
    title: string;
    uri: string;
    content: string;
};

type Message = {
    id: string;
    sender: "bot" | "user";
    text: string;
    timestamp: Date;
    sources?: Source[];
};

type TreeData = {
    soprannome?: string;
    anni?: number;
    posizione?: string;
    [key: string]: unknown;
};

// Funzioni helper separate
const buildHistoryContent = (history: any[]): string => {
    if (!history || history.length === 0) return "";
    
    const eventsByCategory = groupEventsByCategory(history);
    let content = "Eventi storici significativi che ho vissuto:\n\n";
    
    Object.entries(eventsByCategory).forEach(([category, events]) => {
        content += `${category}:\n`;
        (events as any[]).forEach(event => {
            content += `- ${event.year}: ${event.text}\n`;
        });
        content += "\n";
    });

    return content.trim();
};

const groupEventsByCategory = (history: any[]): { [category: string]: any[] } => {
    return history.reduce((acc, event) => {
        const category = event.category || 'Altri Eventi';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(event);
        return acc;
    }, {} as { [category: string]: any[] });
};

const calculateHistoryWordCount = (history: any[]): number => {
    return history.reduce((count, event) => {
        return count + (event.text?.split(/\s+/).length || 0) + 3; // +3 per l'anno e formattazione
    }, 0);
};


// Funzioni helper per interagire con api/rag/route.py
const chatbotAPI = {
  resetSession: () => {}, // non serve più per ora, ma lasciamo placeholder

  async initializeChatbot(treeData: any, ragStructure: any) {
    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initialize_space",
          ragStructure: ragStructure
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore inizializzazione RAG");

      return {
        success: data.success,
        message: data.message,
        tree_name: treeData?.name || "albero monumentale",
        treeAge: treeData?.age || null,
        treeLocation: treeData?.location || null,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async sendMessage(query: string) {
    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "query",
          query: query
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore query RAG");

      return {
        success: data.success,
        response: data.response,
        sources: data.sources || []
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};



export default function ChatbotContent() {
    const userContext = useContext(UserContext);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
    const [showSources, setShowSources] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [ragStructureDebug, setRagStructureDebug] = useState<string>("");

    const QUICK_REPLIES = [
      "Qual è il tuo ricordo più antico?",
      "Qual messaggio lasceresti a noi umani?",
      "Cosa hai visto cambiare in questi anni?",
      "Chi ti ha piantato?",
      "Come sei sopravvissuto così a lungo?",
      "Raccontami del clima che hai vissuto",
      "Qual è la tua specie?",
      "Dove ti trovi esattamente?",
      "Quanti anni hai?",
      "Hai mai avuto paura?",
      "Cosa provi quando cambiano le stagioni?"
    ];

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Funzione per costruire la struttura RAG con history integrata
    const buildRAGStructureWithHistory = useCallback((document: any, history?: any[]) => {
        if (!document || !document.sections) {
            console.warn("❌ Documento RAG non valido");
            return document;
        }

        // Crea una copia profonda della struttura RAG
        const enhancedRAGStructure = JSON.parse(JSON.stringify(document));
        
        // Se abbiamo dati di history, integriamoli nella sezione DATI_STORICI esistente
        if (history && history.length > 0) {
            
            const historyContent = buildHistoryContent(history);
            const historyWordCount = calculateHistoryWordCount(history);
            
            // Cerca la sezione DATI_STORICI esistente
            const existingHistoricalSectionIndex = enhancedRAGStructure.sections.findIndex(
                (section: any) => section.type === 'DATI_STORICI'
            );

            if (existingHistoricalSectionIndex !== -1) {
                // Se esiste già una sezione DATI_STORICI, aggiungiamo i dati di history                
                const existingSection = enhancedRAGStructure.sections[existingHistoricalSectionIndex];
                
                // Combina il contenuto esistente con i nuovi dati di history
                const combinedContent = existingSection.content + "\n\n" + historyContent;
                
                // Aggiorna la sezione esistente
                enhancedRAGStructure.sections[existingHistoricalSectionIndex] = {
                    ...existingSection,
                    content: combinedContent,
                    tags: [...new Set([...existingSection.tags, '#EVENTI', '#CRONOLOGIA', '#MEMORIA_STORICA'])],
                    metadata: {
                        ...existingSection.metadata,
                        wordCount: existingSection.metadata.wordCount + historyWordCount,
                        confidence: Math.max(existingSection.metadata.confidence || 0.8, 0.9)
                    }
                };
            } else {
                // Se non esiste una sezione DATI_STORICI, creiamone una nuova                
                const historySection = {
                    id: 'historical_events',
                    type: 'DATI_STORICI',
                    content: historyContent,
                    tags: ['#STORIA', '#EVENTI', '#CRONOLOGIA', '#MEMORIA_STORICA'],
                    metadata: {
                        source: 'historical_timeline',
                        wordCount: historyWordCount,
                        confidence: 0.9,
                        temporalContext: 'storico'
                    }
                };

                enhancedRAGStructure.sections.push(historySection);
            }

            // Aggiorna i metadati globali
            enhancedRAGStructure.metadata = {
                ...enhancedRAGStructure.metadata,
                totalChunks: enhancedRAGStructure.sections.length,
                totalWords: enhancedRAGStructure.sections.reduce((sum: number, section: any) => 
                    sum + (section.metadata?.wordCount || 0), 0),
                sources: [...new Set([...(enhancedRAGStructure.metadata?.sources || []), 'historical_timeline'])]
            };

            // Salva anche per visualizzazione nell'UI
            const historicalSection = enhancedRAGStructure.sections.find((s: any) => s.type === 'DATI_STORICI');
            setRagStructureDebug(`
STRUTTURA RAG INIZIALIZZATA:
- Sezioni totali: ${enhancedRAGStructure.sections.length}
- Parole totali: ${enhancedRAGStructure.metadata.totalWords}
- Eventi storici integrati: ${history.length}
- Fonti: ${enhancedRAGStructure.metadata.sources.join(', ')}

SEZIONE DATI_STORICI AGGIORNATA:
${historicalSection?.content || 'Nessuna sezione storica trovata'}
            `);
        } else {
            setRagStructureDebug("ℹ️  Nessun dato history disponibile per l'integrazione");
        }

        return enhancedRAGStructure;
    }, []);

    const initializeRAGChatbot = useCallback(async () => {
        const { userTree, userSpecies, document, history } = userContext || {};
        
        if (!userTree) {
            setMessages([{
                id: 'error',
                sender: "bot",
                text: "❌ Nessun albero selezionato. Torna alla mappa per trovare un albero.",
                timestamp: new Date()
            }]);
            setApiStatus("offline");
            return;
        }

        setApiStatus("checking");
        setIsLoading(true);
        chatbotAPI.resetSession();

        try {
            // Costruisci la struttura RAG potenziata con history
            const enhancedRAGStructure = buildRAGStructureWithHistory(document, history);

            if (!enhancedRAGStructure || !enhancedRAGStructure.sections) {
                throw new Error("Struttura RAG non valida");
            }

            const result = await chatbotAPI.initializeChatbot(
                userTree as TreeData, 
                enhancedRAGStructure
            );

            if (result.success) {
                const historicalSection = enhancedRAGStructure.sections.find((s: any) => s.type === 'DATI_STORICI');
                const hasHistoricalEvents = history && history.length > 0;
                
                const historyInfo = hasHistoricalEvents 
                    ? `, inclusi ${history.length} eventi storici che ho vissuto personalmente` 
                    : '';
                    
                const welcomeMessage = `Ciao! Sono ${result.tree_name || "un albero monumentale"} 🌳\n\n` +
                    `Ho vissuto per ${result.treeAge || "molti"} anni a ${result.treeLocation || "questo luogo"} ` +
                    `e ho accumulato tante esperienze e ricordi. ` +
                    `La mia memoria contiene ${enhancedRAGStructure.sections.length} sezioni di conoscenza` +
                    `${historyInfo}. ` +
                    `Chiedimi qualsiasi cosa sulla mia vita, le mie esperienze o i cambiamenti che ho visto!`;

                setMessages([{
                    id: 'welcome',
                    sender: "bot",
                    text: welcomeMessage,
                    timestamp: new Date()
                }]);
                setApiStatus("online");
                
            } else {
                throw new Error(result.error || "Errore inizializzazione RAG");
            }
        } catch (error) {
            console.error("❌ Errore inizializzazione chatbot RAG:", error);
            setMessages([{
                id: 'error',
                sender: "bot",
                text: `❌ Impossibile connettersi al servizio RAG. Dettagli: ${error instanceof Error ? error.message : "Errore Sconosciuto"}`,
                timestamp: new Date()
            }]);
            setApiStatus("offline");
        } finally {
            setIsLoading(false);
        }
    }, [userContext, buildRAGStructureWithHistory]);

    useEffect(() => {
        if (!isInitialized && userContext) {
            initializeRAGChatbot();
            setIsInitialized(true);
        }
    }, [userContext, isInitialized, initializeRAGChatbot]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading || apiStatus !== "online") return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            sender: "user",
            text: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const result = await chatbotAPI.sendMessage(text);

            if (result.success && result.response) {
                const botMessage: Message = {
                    id: `bot-${Date.now()}`,
                    sender: "bot",
                    text: result.response,
                    timestamp: new Date(),
                    sources: result.sources || []
                };
                setMessages(prev => [...prev, botMessage]);
            } else {
                const errorMessage: Message = {
                    id: `error-${Date.now()}`,
                    sender: "bot",
                    text: `❌ ${result.error || "Errore nella generazione della risposta"}`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch {
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                sender: "bot",
                text: "❌ Errore di connessione con il servizio RAG.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickReply = (text: string) => {
        handleSendMessage(text);
    };

    const handleSend = () => {
        if (!input.trim() || isLoading || apiStatus !== "online") return;
        handleSendMessage(input);
    };

    const toggleSources = () => {
        setShowSources(!showSources);
    };

    return (
        <div className={styles.content}>
            <BackButton />

            <div className={styles.chatHeader}>
                <div className="d-flex align-items-center gap-3">
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <Badge
                                bg={apiStatus === "online" ? "success" : apiStatus === "checking" ? "warning" : "danger"}
                                className="text-white"
                            >
                                {apiStatus === "online" && "✅ L'albero ti ascolta"}
                                {apiStatus === "offline" && "❌ L'albero non è raggiungibile"}
                                {apiStatus === "checking" && "🔍 Connessione..."}
                            </Badge>
                            {apiStatus === "online" && (
                                <Button
                                    variant="outline-info"
                                    size="sm"
                                    onClick={toggleSources}
                                    className="ms-2"
                                >
                                    {showSources ? "Nascondi Fonti" : "Mostra Fonti"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.chat}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`${styles.message} ${
                            msg.sender === "user" ? styles.user : styles.bot
                        }`}
                    >
                        <div className={styles.messageText}>{msg.text}</div>

                        {msg.sender === "bot" && msg.sources && msg.sources.length > 0 && showSources && (
                            <div className={styles.sourcesSection}>
                                <hr className="my-2" />
                                <small className="text-muted d-block mb-1">
                                    <strong>Fonti utilizzate (Google Search):</strong>
                                </small>
                                {msg.sources.map((source, index) => (
                                    <div key={index} className={styles.sourceItem}>
                                        <Badge bg="secondary" className="me-1">{index + 1}</Badge>
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                            {source.title || (source.content.substring(0, 50) + '...')}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className={styles.typingIndicator}>
                        <div className={styles.typingAvatar}>🌳</div>
                        <div className={styles.typingContent}>
                            <span>L'albero sta rispondendo...</span>
                            <div className={styles.typingDots}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className={styles.quickReplies}>
                <div className={styles.quickScroll}>
                    {QUICK_REPLIES.map((reply, i) => (
                        <Button
                            key={i}
                            onClick={() => handleQuickReply(reply)}
                            variant="outline-primary"
                            size="sm"
                            disabled={isLoading || apiStatus !== "online"}
                            className="me-2 mb-2"
                        >
                            {reply}
                        </Button>
                    ))}
                </div>
            </div>

            <div className={styles.inputBar}>
                <Form.Control
                    type="text"
                    placeholder={isLoading ? "L'albero sta rispondendo..." : "Chiedi qualcosa all'albero..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSend()}
                    disabled={isLoading || apiStatus !== "online"}
                />
                <Button
                    variant="primary"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || apiStatus !== "online"}
                    className={styles.sendButton}
                >
                    {isLoading ? (
                        <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    ) : (
                        "➤"
                    )}
                </Button>
            </div>
        </div>
    );
}