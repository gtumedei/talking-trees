"use client";

import React, { useState, useEffect, useRef, useContext } from "react";
import styles from './Chatbot.module.css'; // Import del modulo CSS
import { Button, Badge, Alert, Form } from "react-bootstrap"; 
import BackButton from "@/app/component/ui/BackButton";
import { UserContext } from "@/app/layout";
import { buildTreeContext } from "@/app/services/TreeContextBuilder";

type Source = {
    title: string;
    uri: string;
    content: string; // Snippet del documento
};

type Message = {
    id: string;
    sender: "bot" | "user";
    text: string;
    timestamp: Date;
    sources?: Source[]; // Tipizzazione corretta
};

// ** Service integrato direttamente nel componente (API Client) **
class ChatbotAPIService {
    private baseURL: string;
    private currentSessionId: string | null = null;

    constructor() {
        this.baseURL = '/api'; 
    }

    async initializeChatbot(tree: any, species?: string): Promise<any> {
        try {
            const response = await fetch(`${this.baseURL}/chatbot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'initialize',
                    tree,
                    species
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Errore HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Errore inizializzazione chatbot');
            }

            this.currentSessionId = data.sessionId;

            return {
                success: true,
                tree_name: data.treeName,
                sessionId: data.sessionId,
                treeAge: data.treeAge,
                treeLocation: data.treeLocation
            };
        } catch (error) {
            console.error('Errore inizializzazione:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Errore di connessione'
            };
        }
    }

    async sendMessage(message: string): Promise<any> {
        if (!this.currentSessionId) {
            return {
                success: false,
                error: 'Chatbot non inizializzato. Prova a riconnetterti.'
            };
        }

        try {
            const response = await fetch(`${this.baseURL}/chatbot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'chat',
                    message,
                    sessionId: this.currentSessionId
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Errore HTTP: ${response.status}`);
            }

            const data = await response.json();

            return {
                success: true,
                response: data.answer,
                sources: data.relevantDocuments as Source[]
            };
        } catch (error) {
            console.error('Errore invio messaggio:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Errore di connessione'
            };
        }
    }

    resetSession() {
        this.currentSessionId = null;
    }
}

const chatbotAPI = new ChatbotAPIService();

export default function ChatbotContent() {
    const userContext = useContext(UserContext);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentTree, setCurrentTree] = useState("Albero Monumentale");
    const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
    const [showSources, setShowSources] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

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

    useEffect(() => {
        if (!isInitialized && userContext) {
            initializeRAGChatbot();
            setIsInitialized(true);
        }
    }, [userContext, isInitialized]);

    const initializeRAGChatbot = async () => {
        const { userTree, userSpecies } = userContext || {};
        
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
            // Usa la funzione importata dal file separato
            const treeContext ='Attendi e modifica';
            
            const result = await chatbotAPI.initializeChatbot(userTree, userSpecies, treeContext);

            if (result.success) {
                setCurrentTree(result.tree_name || userTree.soprannome || "Albero Monumentale");

                setMessages([{
                    id: 'welcome',
                    sender: "bot",
                    text: `Ciao! Sono ${result.tree_name || "un albero monumentale"} 🌳\n\nHo vissuto per ${result.treeAge || "molti"} anni e ho molte storie da raccontare. Chiedimi qualsiasi cosa sulla mia vita, le mie esperienze o i cambiamenti che ho visto!`,
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
    };

    const handleReconnect = async () => {
        const { userTree, userSpecies } = userContext || {};
        if (userTree) {
            await initializeRAGChatbot();
        }
    };

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
        } catch (error) {
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

                        <div className={styles.timestamp}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
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