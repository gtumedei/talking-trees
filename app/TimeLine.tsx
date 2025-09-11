"use client";

import React, { useEffect, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import styles from "./TimeLine.module.css";

type Event = {
  year: number;
  text: string;
  category: string;
};

interface TimeLineProps {
  startYear: number;
  endYear: number;
}

export default function TimeLine({ startYear, endYear }: TimeLineProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<number | null>(null);

  const totalYears = endYear - startYear;
  const getPosition = (year: number) =>
    ((year - startYear) / totalYears) * 100;

  // Estrazione casuale di 1 evento per ogni intervallo di 50 anni
  const pickRandomEvents = (data: Event[]): Event[] => {
    const selected: Event[] = [];
    for (let y = startYear; y <= endYear; y += 50) {
      const slotEvents = data.filter((e) => e.year >= y && e.year < y + 50);
      if (slotEvents.length > 0) {
        const random = slotEvents[Math.floor(Math.random() * slotEvents.length)];
        selected.push(random);
      }
    }
    return selected;
  };

  useEffect(() => {
    fetch("/event_catalog.json")
      .then((res) => res.json())
      .then((data: Event[]) => {
        const filtered = data.filter(
          (e) => e.year >= startYear && e.year <= endYear
        );
        const picked = pickRandomEvents(filtered);
        setEvents(picked);
      })
      .catch((err) => console.error("Errore caricamento eventi:", err));
  }, [startYear, endYear]);

  // Tacche ogni 50 anni
  const ticks: number[] = [];
  for (let y = startYear; y <= endYear; y += 50) {
    ticks.push(y);
  }

  return (
    <div className="mt-2">
    <p>Alcuni eventi successi durante la mia vita</p>
    <div className={styles.timelineContainer}>
      <div className={styles.timelineBar}>
        {/* Tacche */}
        {ticks.map((year, i) => (
          <div
            key={i}
            className={styles.tick}
            style={{ left: `${getPosition(year)}%` }}
          >
            <span className={styles.tickLabel}>{year}</span>
          </div>
        ))}

        {/* Eventi selezionati random */}
        {events.map((event, i) => (
          <OverlayTrigger
            key={i}
            placement="bottom"
            overlay={
              <Tooltip id={`tooltip-${i}`} className={styles.customTooltip}>
                <strong>{event.year}</strong> <br/> {event.text} 
              </Tooltip>}
          >
            <div
              className={`${styles.eventDot} ${
                event.year === endYear ? styles.today : ""
              }`}
              style={{ left: `${getPosition(event.year)}%` }}
              onClick={() => setActiveEvent(i)}
            />
          </OverlayTrigger>
        ))}
      </div>

      {/* Evento selezionato (click) 
      {activeEvent !== null && (
        <div className={styles.eventInfo}>
          <strong>{events[activeEvent].year}:</strong>{" "}
          {events[activeEvent].text}{" "}
          <em>({events[activeEvent].category})</em>
        </div>
      )}*/}
    </div>
    </div>
  );
}
