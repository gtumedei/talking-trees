"use client";

import React, { useState, useEffect, useRef, useContext } from "react";
import styles from "./Chatbot.module.css";
import { Button } from "react-bootstrap";
import { chatbotAPI, ChatResponse } from "../../services/chatbotAPI";
import BackButton from "@/app/component/ui/BackButton";
import { UserContext } from "@/app/layout";

type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
};

export default function ChatbotContent() {
  const { userTree, userSpecies, chatbotInitialized } = useContext(UserContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTree, setCurrentTree] = useState("Albero Monumentale");
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    "Qual è il tuo ricordo più antico?",
    "Qual messaggio lasceresti a noi?",
    "Cosa hai visto in tutti questi anni?",
    "Chi ti ha piantato?",
    "Come sei sopravvissuto così a lungo?",
    "Raccontami del clima che hai vissuto",
    "Qual è la tua specie?",
    "Dove ti trovi?",
    "Quanti anni hai?",
    "Quanto sei alto?"
  ];

  // Scroll automatico ai nuovi messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check connessione e setup iniziale
  useEffect(() => {
    initializeChatbot();
  }, []);

  const initializeChatbot = async () => {
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
    
    try {
      // Se il chatbot è già inizializzato, usa quello esistente
      const result = await chatbotAPI.initializeChatbot(userTree, userSpecies);
      
      if (result.success) {
        setCurrentTree(result.tree_name || userTree.soprannome || "Albero Monumentale");
        setMessages([{
          id: 'welcome',
          sender: "bot",
          text: `Ciao! Sono ${result.tree_name || "un albero monumentale"}. 🌳 Chiedimi qualsiasi cosa sulla mia vita e le mie esperienze!`,
          timestamp: new Date()
        }]);
        setApiStatus("online");
      } else {
        throw new Error(result.error || "Errore inizializzazione");
      }
    } catch (error) {
      console.error("❌ Errore inizializzazione chatbot:", error);
      setMessages([{
        id: 'error',
        sender: "bot",
        text: "❌ Errore di connessione con il chatbot.",
        timestamp: new Date()
      }]);
      setApiStatus("offline");
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading || apiStatus !== "online") return;

    // Aggiungi messaggio utente
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
      // Invia al backend - il chatbot è già inizializzato
      const result: ChatResponse = await chatbotAPI.sendMessage(text);
      
      if (result.success && result.response) {
        // Aggiungi risposta IA
        const botMessage: Message = { 
          id: `bot-${Date.now()}`,
          sender: "bot", 
          text: result.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        // Messaggio di errore
        const errorMessage: Message = { 
          id: `error-${Date.now()}`,
          sender: "bot", 
          text: `❌ ${result.error || "Errore sconosciuto"}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = { 
        id: `error-${Date.now()}`,
        sender: "bot", 
        text: "❌ Errore di connessione.",
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

  return (
    <div className={styles.content}>
      <BackButton />
      
      {/* Header con nome albero e status */}
      <div className={styles.chatHeader}>
        <div>
          <h3>🌳 {currentTree}</h3>
          <div className={`${styles.apiStatus} ${styles[apiStatus]}`}>
            {apiStatus === "online" && "✅ Online"}
            {apiStatus === "offline" && "❌ Offline"}
            {apiStatus === "checking" && "🔍 Controllo connessione..."}
          </div>
        </div>
        <Button 
          onClick={initializeChatbot} 
          disabled={isLoading}
          variant="outline-primary"
          size="sm"
        >
          🔄 Riconnetti
        </Button>
      </div>

      {/* Chat Messages */}
      <div className={styles.chat}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${
              msg.sender === "user" ? styles.user : styles.bot
            }`}
          >
            <div className={styles.messageText}>{msg.text}</div>
            <div className={styles.timestamp}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingAvatar}>🌳</div>
            <div className={styles.typingContent}>
              <span>Sta rispondendo...</span>
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

      {/* Quick replies scorrevoli */}
      <div className={styles.quickReplies}>
        <div className={styles.quickScroll}>
          {quickReplies.map((reply, i) => (
            <Button 
              key={i} 
              onClick={() => handleQuickReply(reply)} 
              variant="primary" 
              className="green fw-green"
              disabled={isLoading || apiStatus !== "online"}
            >
              {reply}
            </Button>
          ))}
        </div>
      </div>

      {/* Barra input fissa */}
      <div className={styles.inputBar}>
        <input
          type="text"
          placeholder={isLoading ? "Sto rispondendo..." : "Scrivi un messaggio all'albero..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isLoading || apiStatus !== "online"}
        />
        <button 
          className={`btn-primary myrtle ${styles.sendButton}`}
          onClick={handleSend}
          disabled={!input.trim() || isLoading || apiStatus !== "online"}
        >
          {isLoading ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );
}