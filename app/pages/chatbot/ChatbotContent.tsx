"use client";

import React, { useState, useEffect, useRef, useContext } from "react";
import styles from './Chatbot.module.css';
import { Button, Badge, Form } from "react-bootstrap"; 
import BackButton from "@/app/component/ui/BackButton";
import { UserContext } from "@/app/layout";
import { Source } from "@service/types/interface_db";
import { saveChatToFirebase } from "@service/userServices";  // Importa il servizio
import { TreeProps } from "@service/types/interface_page";  // Importa il servizio
import { UserContextType } from "@/backend/types/interface_context";

type Message = {
    id: string;
    sender: "bot" | "user";
    text: string;
    timestamp: Date;
    sources?: Source[];
};

export default function ChatbotContent({ variant }: TreeProps){
    const {userTree, idSpacevector, idInstance, chatbotIsReady} = useContext(UserContext) as UserContextType;
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const mex = variant=="narrativo" ? "L'albero sta pensando..." : "Stiamo elaborando le informazioni...";
    const [hourglassIndex, setHourglassIndex] = useState(0);
    const hourglassFrames = ["⏳", "⌛"]; // 2 frame, puoi aggiungerne altri
    const [dots, setDots] = useState(1);


    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Versione narrativa (prima persona, tono saggio)
    const QUICK_REPLIES =
    variant === "narrativo"
        ? [
            "Chi sei e qual è la tua storia?",
            "Quanti anni hai?",
            "Qual messaggio lasceresti a noi umani?",
            "Cosa hai visto cambiare in questi anni?",
            "Che benefici porti all'ambiente?",
            "Qual è la tua specie?",
            "Cosa sai dirmi sul luogo in cui ti trovi?",
        ]:[ 
            "Cosa sai dirmi di quest'albero?",
            "Quanti anni ha?",
            "Qual è il suo significato storico o culturale?",
            "Quali cambiamenti ha vissuto?",
            "Che benefici l'albero porta all'ambiente?",
            "Qual è lo stato di salute dell'albero",
            "A quale specie botanica appartiene?",
        ];

    // 👋 Messaggio iniziale
    useEffect(() => {
        let text = ''
        if (variant == "narrativo"){
            text = "Piacere di conoscerti!\n Cosa vuoi che ti racconti?"
        }else{
            text = "Benvenuto!\n Cosa vuoi conoscere dell'albero che hai davanti?"
        }

        const welcomeMsg: Message = {
            id: "welcome",
            sender: "bot",
            text: text,
            timestamp: new Date(),
        };
        setMessages([welcomeMsg]);
    }, []);
    
    useEffect(() => {
        const interval = setInterval(() => {
            // alterna clessidra
            setHourglassIndex(prev => (prev + 1) % hourglassFrames.length);

            // alterna puntini 1 → 3
            setDots(prev => (prev % 3) + 1);
        }, 700); // ogni 700ms

        return () => clearInterval(interval);
    }, []);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // ✉️ Invio messaggio
    const handleSend = async () => {
        if (!input.trim()) return;

        // Se c'è il soprannome, aggiungilo prima del punto interrogativo
        let queryText = input;
        if (userTree?.soprannome) {
            const nickname = userTree.soprannome;
            queryText = input.replace(/\?/, ` ${nickname}?`);
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            sender: "user",
            text: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // ✅ CORREZIONE: Chiamata all'endpoint query con i parametri corretti
            const response = await fetch("https://benny2199-rag-microservice.hf.space/query", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    space_id: idSpacevector,        // ✅ space_id (non index_id)
                    question: queryText,            // ✅ question (non query)
                    tree_name: userTree?.soprannome || "", // ✅ tree_name
                    // ❌ RIMOSSO: prompt_style (ora gestito dall'istanza)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Errore HTTP ${response.status}`);
            }

            const data = await response.json();
            
            // ✅ CORREZIONE: Estrazione corretta del risultato
            if (!data.success) {
                throw new Error(data.error || "Errore nella risposta del servizio");
            }

            const botMessage: Message = {
                id: Date.now().toString() + "_bot",
                sender: "bot",
                text: data.result || "Non ho trovato nulla di rilevante 😔", // ✅ data.result (non data.result.response)
                timestamp: new Date(),
                sources: data.sources || [], // ✅ Mantieni le fonti se presenti
            };
            
            const variantToUse = variant || "";

            // Usa il servizio per salvare la chat su Firestore
            await saveChatToFirebase(input, botMessage.text, userTree?.soprannome || "", variantToUse);
            
            setMessages((prev) => [...prev, botMessage]);
        } catch (error: any) {
            console.error("Errore API:", error);
            
            const errorMessage: Message = {
                id: Date.now().toString() + "_error",
                sender: "bot",
                text: `⚠️ ${error.message || "C'è stato un problema nel contattare l'albero. Riprova più tardi."}`,
                timestamp: new Date(),
            };
            
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickReply = (reply: string) => {
        setInput(reply);
        handleSend();
    };

    if(!chatbotIsReady){
        return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <BackButton />
            <p className="fw-bold">
                {hourglassFrames[hourglassIndex]} Caricamento chatbot in corso
                <span style={{width:"50px"}}>{".".repeat(dots)}</span>
            </p>

        </div>
        )
    }
    else{
        return (
            <div className={styles.content}>
                <BackButton message="Sei sicuro di voler abbandonare la chat" />

                <div className={styles.chat}>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`${styles.message} ${
                                msg.sender === "user" ? styles.user : styles.bot
                            }`}
                        >
                            <div className={styles.messageText}>{msg.text}</div>

                            {msg.sender === "bot" && msg.sources && msg.sources.length > 0 && (
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
                                variant="primary"
                                size="sm"
                                disabled={isLoading}
                                className="me-2 mb-2 green"
                            >
                                {reply}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className={styles.inputBar}>
                    <Form.Control
                        type="text"
                        placeholder={isLoading ? mex : "Chiedi qualcosa all'albero..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSend()}
                        disabled={isLoading}
                    />
                    <Button
                        variant="primary"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
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
}