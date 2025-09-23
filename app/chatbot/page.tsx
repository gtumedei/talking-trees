"use client";

import React, { useState } from "react";
import styles from "./Chatbot.module.css";
import { Button } from "react-bootstrap";
import BackButton from "../component/BackButton";

type Message = {
  sender: "bot" | "user";
  text: string;
};

export default function ChatbotContent() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "Benvenuto! Io sono il Cipresso di San Francesco. Raccontami cosa ti porta qui oggi." },
    { sender: "user", text: "Hai conosciuto San Francesco?" },
    { sender: "bot", text: "Oh sì. Francesco amava la semplicità della natura e spesso si fermava qui, parlando con me come si parla a un vecchio amico. Anche se il tempo passa, il ricordo di quei momenti è ancora vivido." },
    { sender: "user", text: "Hai mai vissuto guerre o eventi importanti?" },
    { sender: "bot", text: "Purtroppo sì. Durante l'epoca napoleonica, nel 1796, i soldati tentarono di bruciarmi, ma un messaggero arrivò in tempo per fermarli. Anche durante la Seconda Guerra Mondiale ho assistito a momenti difficili, ma ho resistito a tutte queste avversità." },
  ]);

  const [input, setInput] = useState("");

  const quickReplies = [
    "Qual è il tuo ricordo più antico?",
    "Qual messaggio lasceresti a noi?",
    "Cosa hai visto in tutti questi anni?",
    "Chi ti ha piantato?",
    "Come sei sopravvissuto così a lungo?"
  ];

  const handleReply = (text: string) => {
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "È una lunga storia... ma te la racconterò." },
      ]);
    }, 1000);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    handleReply(input);
    setInput("");
  };

  return (
    <div className={styles.content}>
      <BackButton />
      {/* Chat */}
      <div className={styles.chat}>
        {messages.map((msg, i) => (
          <p
            key={i}
            className={`${styles.message} ${
              msg.sender === "user" ? styles.user : styles.bot
            }`}
          >
            {msg.text}
          </p>
        ))}
      </div>

      {/* Quick replies scorrevoli */}
      <div className={styles.quickReplies}>
        <div className={styles.quickScroll}>
          {quickReplies.map((reply, i) => (
            <Button key={i} onClick={() => handleReply(reply)} variant="primary" className="green fw-green">
              {reply}
            </Button>
          ))}
        </div>
      </div>

      {/* Barra input fissa */}
      <div className={styles.inputBar}>
        <input
          type="text"
          placeholder="Scrivi un messaggio..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="btn-primary myrtle" onClick={handleSend}>➤</button>
      </div>

    </div>
  );
}
