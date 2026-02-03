"use client"

import React, { useState, useEffect, useRef, useContext } from "react"
import styles from "./Chatbot.module.css"
import { Button, Badge, Form, Modal, Alert } from "react-bootstrap"
import BackButton from "@/app/component/ui/BackButton"
import { UserContext } from "@/app/layout"
import { Source } from "@service/types/interface_db"
import { saveChatToFirebase } from "@service/userServices"
import { TreeProps } from "@service/types/interface_page"
import { UserContextType } from "@/backend/types/interface_context"

type Message = {
  id: string
  sender: "bot" | "user"
  text: string
  timestamp: Date
  sources?: Source[]
}

// Separazione delle parti del prompt
const PROMPT_STRUCTURE = {
  // Parte modificabile (prima parte)
  modifiableParts: {
    narrativo:
      "Rispondi in una frase in 1ª persona in tono epico e solenne come se fossi {treename}.",
    scientifico: "Rispondi in terza persona con stile enciclopedico.",
  },
  // Parte fissa (seconda parte)
  fixedPart: "Usa solo il contesto.\nContesto:{context}\nDomanda:{question}\nRisposta breve:",
}

// Costruzione dei prompt completi
const DEFAULT_PROMPTS = {
  narrativo: PROMPT_STRUCTURE.modifiableParts.narrativo + "\n" + PROMPT_STRUCTURE.fixedPart,
  scientifico: PROMPT_STRUCTURE.modifiableParts.scientifico + "\n" + PROMPT_STRUCTURE.fixedPart,
}

export default function ChatbotContent({ variant }: TreeProps) {
  const { userTree, idSpacevector, idInstance, chatbotIsReady } = useContext(
    UserContext,
  ) as UserContextType
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hourglassIndex, setHourglassIndex] = useState(0)
  const [dots, setDots] = useState(1)

  // Stato per il prompt e la modifica
  const [customPrompt, setCustomPrompt] = useState(
    DEFAULT_PROMPTS[variant as keyof typeof DEFAULT_PROMPTS] || DEFAULT_PROMPTS.scientifico,
  )
  const [modifiablePart, setModifiablePart] = useState(
    PROMPT_STRUCTURE.modifiableParts[variant as keyof typeof PROMPT_STRUCTURE.modifiableParts] ||
      PROMPT_STRUCTURE.modifiableParts.scientifico,
  )

  const [showEditModal, setShowEditModal] = useState(false)
  const [editPromptPart, setEditPromptPart] = useState("")
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hourglassFrames = ["⏳", "⌛"]
  const mex =
    variant == "narrativo" ? "L'albero sta pensando..." : "Stiamo elaborando le informazioni..."

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
        ]
      : [
          "Cosa sai dirmi di quest'albero?",
          "Quanti anni ha?",
          "Qual è il suo significato storico o culturale?",
          "Quali cambiamenti ha vissuto?",
          "Che benefici l'albero porta all'ambiente?",
          "Qual è lo stato di salute dell'albero",
          "A quale specie botanica appartiene?",
        ]

  // Invece di costruire il prompt ogni volta, usa direttamente la stringa completa
  const buildFullPrompt = (modifiable: string) => {
    return modifiable + "\n" + PROMPT_STRUCTURE.fixedPart
  }

  // 👋 Messaggio iniziale
  useEffect(() => {
    let text = ""
    if (variant == "narrativo") {
      text = "Piacere di conoscerti!\n Cosa vuoi che ti racconti?"
    } else {
      text = "Benvenuto!\n Cosa vuoi conoscere dell'albero che hai davanti?"
    }

    const welcomeMsg: Message = {
      id: "welcome",
      sender: "bot",
      text: text,
      timestamp: new Date(),
    }
    setMessages([welcomeMsg])

    // Carica il prompt salvato dal localStorage se esiste
    const savedPromptPart = localStorage.getItem(`chatbot_prompt_${variant}_modifiable`)
    if (savedPromptPart) {
      setModifiablePart(savedPromptPart)
      setIsEditing(true)
    } else {
      // Imposta il valore predefinito
      const defaultPart =
        PROMPT_STRUCTURE.modifiableParts[
          variant as keyof typeof PROMPT_STRUCTURE.modifiableParts
        ] || PROMPT_STRUCTURE.modifiableParts.scientifico
      setModifiablePart(defaultPart)
      setIsEditing(false)
    }
  }, [variant])

  // Aggiorna customPrompt quando cambia modifiablePart
  useEffect(() => {
    setCustomPrompt(buildFullPrompt(modifiablePart))
  }, [modifiablePart])
  // Aggiorna customPrompt quando cambia modifiablePart
  useEffect(() => {
    setCustomPrompt(buildFullPrompt(modifiablePart))
  }, [modifiablePart])

  useEffect(() => {
    const interval = setInterval(() => {
      setHourglassIndex((prev) => (prev + 1) % hourglassFrames.length)
      setDots((prev) => (prev % 3) + 1)
    }, 700)

    return () => clearInterval(interval)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  // ✉️ Invio messaggio
  const handleSend = async () => {
    if (!input.trim()) return

    // Se c'è il soprannome, aggiungilo prima del punto interrogativo
    let queryText = input
    if (userTree?.soprannome) {
      const nickname = userTree.soprannome
      queryText = input.replace(/\?/, ` ${nickname}?`)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("https://benny2199-rag-microservice.hf.space/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          space_id: idSpacevector,
          question: queryText,
          tree_name: userTree?.soprannome || "",
          prompt_template: customPrompt, // Invia il prompt personalizzato
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Errore HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Errore nella risposta del servizio")
      }

      const botMessage: Message = {
        id: Date.now().toString() + "_bot",
        sender: "bot",
        text: data.result || "Non ho trovato nulla di rilevante 😔",
        timestamp: new Date(),
        sources: data.sources || [],
      }

      const variantToUse = variant || ""
      await saveChatToFirebase(input, botMessage.text, userTree?.soprannome || "", variantToUse)

      setMessages((prev) => [...prev, botMessage])
    } catch (error: any) {
      console.error("Errore API:", error)

      const errorMessage: Message = {
        id: Date.now().toString() + "_error",
        sender: "bot",
        text: `⚠️ ${error.message || "C'è stato un problema nel contattare l'albero. Riprova più tardi."}`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickReply = (reply: string) => {
    setInput(reply)
    handleSend()
  }

  // Gestione modifica prompt
  const handleOpenEditModal = () => {
    setEditPromptPart(modifiablePart)
    setPassword("")
    setPasswordError(false)
    setShowEditModal(true)
  }

  const handleSavePrompt = () => {
    if (password === "1234") {
      setModifiablePart(editPromptPart)
      localStorage.setItem(`chatbot_prompt_${variant}_modifiable`, editPromptPart)
      setShowEditModal(false)
      setIsEditing(true)
    } else {
      setPasswordError(true)
    }
  }

  const handleCancelEdit = () => {
    setShowEditModal(false)
    setPassword("")
    setPasswordError(false)
  }

  const handleResetPrompt = () => {
    const defaultPart =
      PROMPT_STRUCTURE.modifiableParts[variant as keyof typeof PROMPT_STRUCTURE.modifiableParts] ||
      PROMPT_STRUCTURE.modifiableParts.scientifico
    setModifiablePart(defaultPart)
    localStorage.removeItem(`chatbot_prompt_${variant}_modifiable`)
    setIsEditing(false)
  }

  if (!chatbotIsReady) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <BackButton />
        <p className="fw-bold">
          {hourglassFrames[hourglassIndex]} Caricamento chatbot in corso
          <span style={{ width: "50px" }}>{".".repeat(dots)}</span>
        </p>
      </div>
    )
  } else {
    return (
      <div className={styles.content}>
        <BackButton message="Sei sicuro di voler abbandonare la chat" />

        {/* Sezione del prompt */}
        {/* <div className={`${styles.promptSection} mt-5 mx-1`}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <small className="text-muted">Prompt Template:</small>
            <div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleOpenEditModal}
                className="me-2"
              >
                Modifica
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleResetPrompt}
                title="Ripristina prompt predefinito"
                disabled={!isEditing}
              >
                Reset
              </Button>
            </div>
          </div>
          <div className={styles.promptDisplay}>
            <div className={styles.promptPart}>
              <code className={`${styles.promptCode} ${styles.modifiablePart}`}>
                {modifiablePart}
              </code>
              {isEditing && (
                <Badge bg="warning" className="ms-2">
                  Modificato
                </Badge>
              )}
            </div>
            <div className={styles.promptPart}>
              <code className={`${styles.promptCode} ${styles.fixedPart}`}>
                {PROMPT_STRUCTURE.fixedPart}
              </code>
            </div>
          </div>
        </div>
 */}
        <div className={styles.chat}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.message} ${msg.sender === "user" ? styles.user : styles.bot}`}
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
                      <Badge bg="secondary" className="me-1">
                        {index + 1}
                      </Badge>
                      <a
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-decoration-none"
                      >
                        {source.title || source.content.substring(0, 50) + "..."}
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
                className="green"
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
            className="tw:mx-0!"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
              e.key === "Enter" && handleSend()
            }
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

        {/* Modal per la modifica del prompt */}
        <Modal show={showEditModal} onHide={handleCancelEdit} className={styles.modal} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Modifica il Prompt</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Control
                as="textarea"
                rows={3}
                value={editPromptPart}
                onChange={(e) => setEditPromptPart(e.target.value)}
                placeholder="Modifica la prima parte del prompt..."
              />
            </Form.Group>

            <div className="mb-3">
              <small className="text-muted d-block fw-bold">Anteprima del prompt completo:</small>
              <div className={styles.previewFull}>
                <code>
                  {editPromptPart}\n{PROMPT_STRUCTURE.fixedPart}
                </code>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Password (richiesta per la modifica):</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError(false)
                }}
                placeholder="Inserisci la password"
                isInvalid={passwordError}
              />
              {passwordError && (
                <Form.Control.Feedback type="invalid">
                  Password errata. La password corretta è "1234"
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCancelEdit}>
              Annulla
            </Button>
            <Button
              variant="primary"
              onClick={handleSavePrompt}
              disabled={!editPromptPart.trim() || !password}
            >
              Salva Modifiche
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}
