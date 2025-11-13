"use client";

import { useState, useEffect, useContext } from "react";
import styles from "./Diary.module.css";
import Title from "@component/ui/Title";
import { Modal, Button, Form } from "react-bootstrap";
import BackButton from "@component/ui/BackButton";
import { db } from "@/app/services/firebase";
import {collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, arrayUnion, serverTimestamp,
  query, where, orderBy} from "firebase/firestore";
import { UserContext } from "@/app/layout";

// ---------- tipi ----------
type Entry = {
  date: string;
  text: string;
  author?: string;
};

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
  const userContext = useContext(UserContext) || ({} as { userTree?: { ["id scheda"]?: string } | null; user?: boolean });
  const { userTree, user } = userContext;

  const [entries, setEntries] = useState<Entry[]>([]); // ✅ inizializzato come array vuoto
  const [showModal, setShowModal] = useState(false);
  const [newText, setNewText] = useState("");
  const [newAuthor, setNewAuthor] = useState("");

  const seed = 42;

  // 🔥 Funzione per salvare un commento
  const saveCommentToFirebase = async (text: string, signature: string) => {
    try {
      // 🔥 Forza userValue a essere una STRINGA
      const userValue =
        user
          ? user.username
          : signature.trim() !== ""
          ? signature.trim()
          : null;

      const idScheda = String(userTree?.["id scheda"] || "");
      if (!idScheda) {
        console.error("⚠️ Nessun id scheda trovato in userTree");
        return;
      }

      // 💾 1️⃣ Salva sempre il commento in "comments"
      await addDoc(collection(db, "comments"), {
        date: serverTimestamp(),
        id_tree: idScheda,
        text: text.trim(),
        user: userValue, // ora è una stringa
      });
      console.log("✅ Commento aggiunto a Firestore (collezione comments)");

      // 💾 2️⃣ Se esiste un utente loggato, aggiorna anche la struttura user-tree
      if (userValue) {
        const safeTreeId = idScheda.replace(/\//g, ".");
        const userTreeDocRef = doc(db, "user-tree", userValue);

        const userDocSnap = await getDoc(userTreeDocRef);
        if (!userDocSnap.exists()) {
          await setDoc(userTreeDocRef, {});
          console.log("🆕 Creato nuovo documento per utente:", userValue);
        }

        const treeDocRef = doc(collection(userTreeDocRef, "tree"), safeTreeId);
        const treeDocSnap = await getDoc(treeDocRef);

        if (!treeDocSnap.exists()) {
          const lat = userTree.lat || "";
          const lon = userTree.lon || "";
          const coordinates = `${lat},${lon}`;

          await setDoc(treeDocRef, {
            soprannome: userTree.soprannome || "Senza nome",
            specie: userTree["specie nome scientifico"] || "Specie sconosciuta",
            luogo: userTree.comune || "Comune sconosciuto",
            regione: userTree.regione || "Regione sconosciuta",
            coordinates,
            comments: [],
          });
          console.log("🌳 Creato nuovo documento tree per", safeTreeId);
        }

        await updateDoc(treeDocRef, {
          comments: arrayUnion(text.trim()),
        });
        console.log("💬 Commento aggiunto anche in user-tree → tree → comments");
      }
    } catch (error) {
      console.error("❌ Errore nel salvataggio del commento:", error);
    }
  };



  // 🌿 Funzione per caricare i commenti da Firestore
  const loadCommentsFromFirebase = async () => {
    if (!userTree?.["id scheda"]) {
      console.warn("⚠️ Nessun id scheda disponibile per l'albero");
      return;
    }

    try {
      const q = query(
        collection(db, "comments"),
        where("id_tree", "==", userTree?.["id scheda"]),
        orderBy("date", "asc")
      );

      const snapshot = await getDocs(q);

      const loadedEntries: Entry[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          date: data.date?.toDate?.().toLocaleDateString("it-IT") || "—",
          text: data.text || "",
          author: data.user || undefined,
        };
      });

      setEntries(loadedEntries);
      console.log("✅ Commenti caricati da Firestore:", loadedEntries);
    } catch (error) {
      console.error("❌ Errore nel caricamento dei commenti:", error);
    }
  };

  // ⚙️ Carica i commenti una sola volta al montaggio del componente
  useEffect(() => {
    loadCommentsFromFirebase();
  }, []); // ✅ solo al mount

  // ✏️ Aggiungi un nuovo commento
  const handleAddEntry = async () => {
    if (!newText.trim()) return;

    const today = new Date().toLocaleDateString("it-IT");
    const newEntry: Entry = {
      date: today,
      text: newText,
      author: newAuthor.trim() || undefined,
    };

    // Aggiorna lo stato locale subito
    setEntries((prev) => [...prev, newEntry]);
    setNewText("");
    setNewAuthor("");
    setShowModal(false);

    // 💾 Salvataggio nel database Firebase
    await saveCommentToFirebase(newText, newAuthor);

    // 🔄 Ricarica i commenti aggiornati
    await loadCommentsFromFirebase();
  };

  return (
    <main className="p-2">
      <BackButton />
      <Title
        text="Pezzi di Storia"
        level={1}
        className="text-center mt-3 display-6"
      />
      <p className="text-center">
        Leggi i ricordi, gli eventi e le emozioni relative a quest'albero
      </p>

      {/* pulsante sopra i commenti */}
      <div className="mb-1 text-center">
        <Button
          variant="secondary"
          className="flame"
          onClick={() => setShowModal(true)}
        >
          + Aggiungi ricordo
        </Button>
      </div>

      <div className={styles.entries}>
        {entries.length === 0 ? (
          <p className="text-center text-muted mt-3">
            Nessun ricordo ancora presente 🌱
          </p>
        ) : (
          entries.map((entry, i) => {
            const fontIndex = Math.floor(seededRandom(seed + i) * fonts.length);
            const { family, baseSize, fontBold } = fonts[fontIndex];
            const variation =
              Math.floor(seededRandom(seed * (i + 1)) * 3) - 1;
            const fontSize = baseSize + variation;

            console.log(entry)

            return (
              <div key={i} className={styles.entry}>
                <p className={styles.date}>
                  <i>{entry.date}</i>
                </p>
                <p
                  className={`${styles.text} ${
                    fontBold ? "fw-bold" : ""
                  }`}
                  style={{ fontFamily: family, fontSize: `${fontSize}px` }}
                >
                  {entry.text}
                </p>
                {entry.author && (
                  <p
                    className={styles.author}
                    style={{
                      fontFamily: family,
                      fontSize: `${fontSize - 1}px`,
                    }}
                  >
                    — {entry.author}
                  </p>
                )}

                <hr className="my-2" />
              </div>
            );
          })
        )}
      </div>

      {/* modal per aggiungere nuovo commento */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
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
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
          >
            Annulla
          </Button>
          <Button variant="primary" onClick={handleAddEntry}>
            Salva
          </Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}
