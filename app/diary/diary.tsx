"use client";

import React from "react";
import styles from "./Diary.module.css";

type Entry = {
  date: string;
  text: string;
};

const entries: Entry[] = [
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

export default function DiaryPage() {
  return (
    <main className={styles.page}>
      <div className={styles.book}>
        <h2 className={styles.title}>Pezzi di Storia</h2>

        <div className={styles.entries}>
          {entries.map((entry, i) => (
            <div key={i} className={styles.entry}>
              <p className={styles.date}>{entry.date}</p>
              <p className={styles.text}>{entry.text}</p>
            </div>
          ))}
        </div>

        {/* Decorazioni */}
        <img src="/ink-left.png" alt="ink splash" className={styles.inkLeft} />
        <img src="/ink-right.png" alt="ink splash" className={styles.inkRight} />
      </div>
    </main>
  );
}
