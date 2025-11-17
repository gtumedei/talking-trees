"use client";

import { useState, useEffect, useContext } from "react";
import styles from "./Diary.module.css";
import Title from "@component/ui/Title";
import { Modal, Button, Form } from "react-bootstrap";
import BackButton from "@component/ui/BackButton";
import { UserContext } from "@/app/layout";
import { saveCommentToFirebase, loadCommentsFromFirebase } from "@service/userServices";
import { Comment } from "@service/types/interface_db";
import { UserContextType } from "@service/types/interface_context";

export default function DiaryPage() {
  const userContext = useContext(UserContext) || ({} as UserContextType);
  const { userTree, user } = userContext;

  const [entries, setEntries] = useState<Comment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newText, setNewText] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [closeVisible, setCloseVisible] = useState(true);

  // Carica i commenti al montaggio
  useEffect(() => {
    const loadEntries = async () => {
      const loadedEntries = await loadCommentsFromFirebase(userTree);
      setEntries(loadedEntries);
    };
    loadEntries();
  }, [userTree]);

  // Salvataggio nuovo commento
  const handleAddComment = async () => {
    if (!newText.trim()) return;

    const today = new Date().toLocaleDateString("it-IT");

    const newComment: Comment = {
      date: today,
      text: newText,
      author:
        user?.username ||
        (newAuthor.trim() !== "" ? newAuthor.trim() : undefined),
    };

    // Aggiornamento immediato dell’interfaccia
    setEntries((prev) => [...prev, newComment]);

    // Reset form
    setNewText("");
    setNewAuthor("");
    setShowModal(false);
    setCloseVisible(true);

    // Salvataggio su Firebase
    await saveCommentToFirebase(newComment, userTree);

    // Ricarico aggiornato
    const updatedEntries = await loadCommentsFromFirebase(userTree);
    setEntries(updatedEntries);
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setCloseVisible(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCloseVisible(true);
  };

  return (
    <main className="p-2">
      {closeVisible && <BackButton />}

      <Title text="Pezzi di Storia" level={1} className="text-center mt-3 display-6" />
      <p className="text-center">
        Leggi i ricordi, gli eventi e le emozioni relative a quest'albero
      </p>

      <div className="mb-1 text-center">
        <Button variant="secondary" className="flame" onClick={handleOpenModal}>
          + Aggiungi ricordo
        </Button>
      </div>

      <div className={styles.entries}>
        {entries.length === 0 ? (
          <p className="text-center text-muted mt-3">
            Nessun ricordo ancora presente 🌱
          </p>
        ) : (
          entries.map((comment, i) => (
            <div key={i} className={styles.Comment}>
              <p className={styles.date}>
                <i>{comment.date}</i>
              </p>
              <p className={styles.text}>{comment.text}</p>
              {comment.author && (
                <p className={styles.author}>— {comment.author}</p>
              )}
              <hr className="my-2" />
            </div>
          ))
        )}
      </div>

      {/* MODAL CENTRATO */}
      <Modal show={showModal} onHide={handleCloseModal} centered className={styles.modal}>
        <Modal.Header className={styles.modalTitle} closeButton>
          <Modal.Title>Aggiungi il tuo ricordo</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Ricordo</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Scrivi il tuo ricordo..."
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Firma (opzionale)</Form.Label>
              <Form.Control
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Il tuo nome"
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" className="flame" onClick={handleCloseModal}>
            Annulla
          </Button>
          <Button variant="primary" className="flame" onClick={handleAddComment}>
            Salva
          </Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}
