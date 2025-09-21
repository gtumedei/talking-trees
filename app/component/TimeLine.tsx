"use client";

import React, { useState, useEffect } from "react";
import { OverlayTrigger, Tooltip, Form, Button, Dropdown, DropdownButton } from "react-bootstrap";

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
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "storico",
    "artistico",
    "culturale",
    "scientifico",
    "tecnologico",
    "sportivo",
  ]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  const totalYears = endYear - startYear;
  const getPosition = (year: number) => ((year - startYear) / totalYears) * 100;

  // Carica eventi dal JSON
  useEffect(() => {
    const loadEvents = async () => {
      const res = await fetch("/event_catalog.json");
      const data: Event[] = await res.json();
      setAllEvents(data);
      setFilteredEvents(selectRandomEvents(data, selectedCategories));
    };
    loadEvents();
  }, []);

  // Gestione toggle categorie
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Funzione per scegliere 1 evento random per slot di 50 anni
  const selectRandomEvents = (events: Event[], categories: string[]) => {
    const filtered = events.filter(e => categories.includes(e.category));
    const selected: Event[] = [];

    for (let y = startYear; y <= endYear; y += 50) {
      const slotEvents = filtered.filter(e => e.year >= y && e.year < y + 50);
      if (slotEvents.length > 0) {
        const random = slotEvents[Math.floor(Math.random() * slotEvents.length)];
        selected.push(random);
      }
    }
    return selected;
  };

  // Applica filtro
  const applyFilter = () => {
    setFilteredEvents(selectRandomEvents(allEvents, selectedCategories));
  };

  // Tacche ogni 50 anni
  const ticks: number[] = [];
  for (let y = startYear; y <= endYear; y += 50) {
    ticks.push(y);
  }

  const parseText = (text: string) => {
    const regex = /\*(.*?)\*/g;
    const parts = [];
    let lastIndex = 0;

    // Cerca tutte le occorrenze di testo tra * *
    let match;
    while ((match = regex.exec(text)) !== null) {
      // Aggiungi la parte del testo prima dell'asterisco
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      // Aggiungi il testo in corsivo
      parts.push(<em key={match.index}>{match[1]}</em>);
      lastIndex = regex.lastIndex;
    }

    // Aggiungi la parte finale del testo
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return (
    <div className="mt-2 mx-2">

      <p className="mb-1 text-center">Alcuni eventi successi durante la mia vita</p>
      <div className={styles.timelineContainer}>
        <div className={styles.timelineBar}>
          {/* Tacche ogni 50 anni */}
          {ticks.map((year, i) => (
            <div
              key={i}
              className={styles.tick}
              style={{ left: `${getPosition(year)}%` }}
            >
              <span className={styles.tickLabel}>{year}</span>
            </div>
          ))}

          {/* Eventi */}
          {filteredEvents.map((event, i) => (
            <OverlayTrigger
  key={i}
  placement="top"
  overlay={
    <Tooltip
      className={styles.customTooltip}
      onClick={() =>
        window.open(`https://www.google.com/search?q=${encodeURIComponent(event.text)}`, "_blank")
      }
      style={{ cursor: "pointer" }}
    >
      {parseText(event.text)} ({event.year})
    </Tooltip>
  }
>
  <div
    className={styles.eventDot}
    style={{ left: `${getPosition(event.year)}%` }}
  />
</OverlayTrigger>
          ))}
        </div>
      </div>

       {/* Menu di filtro dentro combobox/accordion */}
      <div className="mt-3 pt-1 text-end">
        <DropdownButton id="dropdown-categories" title="Filtra tipologia eventi" drop="start" className={styles.dropdownCustom}>
          <div className={styles.dropdownMenuCustom}>
            {["storico", "artistico", "culturale", "scientifico", "tecnologico", "sportivo"].map(
              cat => (
                <Form.Check
                  key={cat}
                  type="checkbox"
                  label={cat}
                  checked={selectedCategories.includes(cat)}
                  onChange={() => handleCategoryChange(cat)}
                  className={styles.dropdownCheck}
                />
              )
            )}
            <div className="mt-3 text-center">
              <Button className={styles.filterButton} size="sm" onClick={applyFilter}>
                Mostra
              </Button>
            </div>
          </div>
        </DropdownButton>

      </div>

    </div>
  );
}
