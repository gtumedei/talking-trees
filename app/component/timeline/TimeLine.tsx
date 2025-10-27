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

  /*Color*/
  function lerpColor(a: string, b: string, amount: number) {
    const ah = parseInt(a.replace(/#/g, ""), 16);
    const bh = parseInt(b.replace(/#/g, ""), 16);
    const ar = ah >> 16, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
    const br = bh >> 16, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
    const rr = ar + amount * (br - ar);
    const rg = ag + amount * (bg - ag);
    const rb = ab + amount * (bb - ab);
    return `rgb(${rr|0},${rg|0},${rb|0})`;
  }
  // Moved percent and color calculation inside the map callback below


  return (
    <div className="mt-2 mx-2">

      <p className="mb-1 text-center">Alcuni eventi successi durante la mia vita</p>
      <div className={styles.timelineContainer}>
        <div className={styles.timelineBar}>
          {/* Tacche ogni 50 anni */}
          {ticks.map((year, i) => (
            <div
              key={year}
              className={styles.tick}
              style={{ left: `${getPosition(year)}%` }}
            >
              <span
                className={`${styles.tickLabel} ${
                  i % 2 === 0 ? styles.tickLabelTop : styles.tickLabelBottom
                }`}
              >
                {year}
              </span>
            </div>
          ))}

          {/* Eventi */}
          {filteredEvents.map((event, i) => {
            const percent = (event.year - startYear) / totalYears;

            // Colore dal gradiente timeline
            const hoverColor = lerpColor("#4B301E", "#8BA96E", percent); 

            return (
              <OverlayTrigger
                key={event.year + "-" + i}
                overlay={
                  <Tooltip
                    className={styles.customTooltip}
                    onClick={() =>
                      window.open(`https://www.google.com/search?q=${encodeURIComponent(event.text)}`, "_blank")
                    }
                    style={{ cursor: "pointer", color: hoverColor }}
                  >
                    <span className={styles.dateEvent}>{event.year}</span>
                    <br />
                    <span>{parseText(event.text)}</span>
                  </Tooltip>
                }
              >
                <div
                  className={styles.eventDot}
                  style={{
                    left: `${getPosition(event.year)}%`, 
                     boxShadow: `inset 0 0 0 2.5px ${hoverColor}`, // ✅ bordo colorato
                  }}
                  // ✅ cambio colore solo on hover
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = hoverColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "";
                  }}
                />
              </OverlayTrigger>
            );
          })}

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
            <div className="mt-1 text-center">
              <Button className={`${styles.filterButton} noir`} size="sm" onClick={applyFilter}>
                Mostra
              </Button>
            </div>
          </div>
        </DropdownButton>

      </div>

    </div>
  );
}
