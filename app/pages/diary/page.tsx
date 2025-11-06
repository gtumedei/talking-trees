"use client";

import React, { useState } from "react";
import styles from "./Diary.module.css";
import Title from "@component/ui/Title";
import { Modal, Button, Form } from "react-bootstrap";
import BackButton from "@component/ui/BackButton";

// ---------- tipi ----------
type Entry = {
  date: string;
  text: string;
  author?: string;
};

// ---------- dati iniziali ----------
const initialEntries: Entry[] = [
  {
    date: "12/03/2018",
    text: "Ero in viaggio con la mia famiglia quando ci siamo fermati qui. I bambini sembravano vivere un’avventura meravigliosa, mentre io e mia moglie ci tenevamo per mano in silenzio. Per qualche minuto, il tempo sembrava essersi fermato."
  },
  {
    date: "21/06/2023",
    text: "Dopo mesi chiusa in casa per il COVID, sono venuto qui per la prima volta. Avevo bisogno di respirare aria vera, e sentire che il mondo esisteva ancora. Toccare questo albero, così antico e immutabile, mi ha dato una strana sensazione di pace."
  },
  {
    date: "08/11/2024",
    text: "Ho sempre amato l’idea di dover fare tutto in fretta, di dover correre per raggiungere qualcosa. Poi ho visto questo albero vecchio di quasi 800 anni, e ho pensato: lui non ha fretta. Ho rallentato, ho respirato e per la prima volta dopo tanto tempo mi sono sentito davvero presente. Come se il tempo si fosse fermato per un attimo."
  },
  {
    date: "12/03/2018",
    text: "Ero in viaggio con la mia famiglia quando ci siamo fermati qui. I bambini sembravano vivere un’avventura meravigliosa, mentre io e mia moglie ci tenevamo per mano in silenzio. Per qualche minuto, il tempo sembrava essersi fermato."
  },
  {
    date: "21/06/2023",
    text: "Dopo mesi chiusa in casa per il COVID, sono venuto qui per la prima volta. Avevo bisogno di respirare aria vera, e sentire che il mondo esisteva ancora. Toccare questo albero, così antico e immutabile, mi ha dato una strana sensazione di pace."
  },
  {
    date: "08/11/2024",
    text: "Ho sempre amato l’idea di dover fare tutto in fretta, di dover correre per raggiungere qualcosa. Poi ho visto questo albero vecchio di quasi 800 anni, e ho pensato: lui non ha fretta. Ho rallentato, ho respirato e per la prima volta dopo tanto tempo mi sono sentito davvero presente. Come se il tempo si fosse fermato per un attimo."
  },
  {
    date: "12/03/2018",
    text: "Ero in viaggio con la mia famiglia quando ci siamo fermati qui. I bambini sembravano vivere un’avventura meravigliosa, mentre io e mia moglie ci tenevamo per mano in silenzio. Per qualche minuto, il tempo sembrava essersi fermato."
  },
  {
    date: "21/06/2023",
    text: "Dopo mesi chiusa in casa per il COVID, sono venuto qui per la prima volta. Avevo bisogno di respirare aria vera, e sentire che il mondo esisteva ancora. Toccare questo albero, così antico e immutabile, mi ha dato una strana sensazione di pace."
  },
  {
    date: "08/11/2024",
    text: "Ho sempre amato l’idea di dover fare tutto in fretta, di dover correre per raggiungere qualcosa. Poi ho visto questo albero vecchio di quasi 800 anni, e ho pensato: lui non ha fretta. Ho rallentato, ho respirato e per la prima volta dopo tanto tempo mi sono sentito davvero presente. Come se il tempo si fosse fermato per un attimo."
  }
];

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

// ---------- DiaryPage ----------
export default function DiaryPage() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [showModal, setShowModal] = useState(false);
  const [newText, setNewText] = useState("");
  const [newAuthor, setNewAuthor] = useState("");

  const seed = 42; // fisso → da sostituire con "id" albero

  // funzione per aggiungere un nuovo commento
  const handleAddEntry = () => {
    if (!newText.trim()) return;

    const today = new Date().toLocaleDateString("it-IT");
    const newEntry: Entry = {
      date: today,
      text: newText,
      author: newAuthor.trim() || undefined
    };
    setEntries([...entries, newEntry]);
    setNewText("");
    setNewAuthor("");
    setShowModal(false);
  };

  return (
    <main className="p-2">
      <BackButton/>
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
        {entries.map((entry, i) => {
          // font casuale deterministico
          const fontIndex = Math.floor(seededRandom(seed + i) * fonts.length);
          const { family, baseSize, fontBold } = fonts[fontIndex];

          // variazione deterministica tra -1 e +1
          const variation = Math.floor(seededRandom(seed * (i + 1)) * 3) - 1;
          const fontSize = baseSize + variation;

          return (
            <div key={i} className={styles.entry}>
              
              {/* data in font normale */}
              <p className={styles.date}><i>{entry.date}</i></p>
              {/* testo + autore con font random */}
              <p
                className={`${styles.text} ${fontBold ? 'fw-bold' : ''}`}
                style={{ fontFamily: family, fontSize: `${fontSize}px` }}
              >
                {entry.text}
              </p>
              {entry.author && (
                <p
                  className={styles.author}
                  style={{ fontFamily: family, fontSize: `${fontSize - 1}px` }}
                >
                  — {entry.author}
                </p>
              )}
              <hr className="my-2" /> {/* linea di separazione */}
            </div>
          );
        })}
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
          <Button variant="secondary" onClick={() => setShowModal(false)}>
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
