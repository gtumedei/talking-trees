"use client";

import { useState, useEffect, useContext } from "react";
import styles from "./Diary.module.css";
import Title from "@component/ui/Title";
import { Modal, Button, Form } from "react-bootstrap";
import BackButton from "@component/ui/BackButton";
import { UserContext } from "@/app/layout";
import { saveCommentToFirebase, loadCommentsFromFirebase } from "@service/userServices";
import { Comment } from "@service/types/interface_db";
import { UserContextType } from '@service/types/interface_context';


// ---------- lista font con dimensione base ----------
const fonts = [
  { family: "'Homemade Apple', cursive", baseSize: 11, fontBold: true },
  { family: "'Reenie Beanie', cursive", baseSize: 14, fontBold: true },
  { family: "'Indie Flower', cursive", baseSize: 14, fontBold: true },
  { family: "'Just Me Again Down Here', cursive", baseSize: 15, fontBold: false },
  { family: "'Beth Ellen', cursive", baseSize: 14, fontBold: true },
  { family: "'Waiting for the Sunrise', cursive", baseSize: 14, fontBold: true },
  { family: "'Dr Sugiyama', cursive", baseSize: 15, fontBold: false },
];

// ---------- funzione per generare numeri pseudo-casuali con seed ----------
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ---------- COMPONENTE ----------
export default function DiaryPage() {
  const userContext = useContext(UserContext) || ({} as UserContextType);
  const { userTree, user } = userContext;

  const [entries, setEntries] = useState<Comment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newText, setNewText] = useState("");
  const [newAuthor, setNewAuthor] = useState("");

  const seed = 42;

  // Carica i commenti quando il componente si monta
  useEffect(() => {
    const loadEntries = async () => {
      const loadedEntries = await loadCommentsFromFirebase(userTree);
      setEntries(loadedEntries);
    };
    loadEntries();
  }, [userTree]);

  // Aggiungi un nuovo commento
  const handleAddComment = async () => {
    if (!newText.trim()) return;

    const today = new Date().toLocaleDateString("it-IT");
    const newComment: Comment = {
      date: today,
      text: newText,
      author: user ? user.username : newAuthor.trim() !== "" ? newAuthor.trim() : undefined
    };

    setEntries((prev) => [...prev, newComment]);
    setNewText("");
    setNewAuthor("");
    setShowModal(false);

    await saveCommentToFirebase(newComment, userTree);
    const updatedEntries = await loadCommentsFromFirebase(userTree);
    setEntries(updatedEntries);
  };

  return (
    <main className="p-2">
      <BackButton />
      <Title text="Pezzi di Storia" level={1} className="text-center mt-3 display-6" />
      <p className="text-center">Leggi i ricordi, gli eventi e le emozioni relative a quest'albero</p>

      <div className="mb-1 text-center">
        <Button variant="secondary" className="flame" onClick={() => setShowModal(true)}>
          + Aggiungi ricordo
        </Button>
      </div>

      <div className={styles.entries}>
        {entries.length === 0 ? (
          <p className="text-center text-muted mt-3">Nessun ricordo ancora presente 🌱</p>
        ) : (
          entries.map((Comment, i) => {
            const fontIndex = Math.floor(seededRandom(seed + i) * fonts.length);
            const { family, baseSize, fontBold } = fonts[fontIndex];
            const variation = Math.floor(seededRandom(seed * (i + 1)) * 3) - 1;
            const fontSize = baseSize + variation;

            return (
              <div key={i} className={styles.Comment}>
                <p className={styles.date}>
                  <i>{Comment.date}</i>
                </p>
                <p className={`${styles.text} ${fontBold ? "fw-bold" : ""}`} style={{ fontFamily: family, fontSize: `${fontSize}px` }}>
                  {Comment.text}
                </p>
                {Comment.author && (
                  <p className={styles.author} style={{ fontFamily: family, fontSize: `${fontSize - 1}px` }}>
                    — {Comment.author}
                  </p>
                )}
                <hr className="my-2" />
              </div>
            );
          })
        )}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Aggiungi il tuo ricordo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Ricordo</Form.Label>
              <Form.Control as="textarea" rows={3} value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Scrivi il tuo ricordo..." />
            </Form.Group>
            <Form.Group>
              <Form.Label>Firma (opzionale)</Form.Label>
              <Form.Control type="text" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} placeholder="Il tuo nome" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleAddComment}>
            Salva
          </Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}
