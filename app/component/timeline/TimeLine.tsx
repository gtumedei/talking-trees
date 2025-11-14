"use client";

import { useState, useEffect, useContext } from "react";
import { OverlayTrigger, Tooltip, Form, Button, DropdownButton } from "react-bootstrap";
import { UserContext } from "@/app/layout";
import styles from "./TimeLine.module.css";
import { UserContextType, EventType } from "@/backend/types/interface_context";

interface TimeLineProps {
  eta: string;
  endYear: number;
}

export default function TimeLine({ eta, endYear}: TimeLineProps) {
  const { history, setHistory } = useContext(UserContext) as UserContextType;
  
  const [allEvents, setAllEvents] = useState<EventType[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "storico",
    "artistico",
    "culturale",
    "scientifico",
    "tecnologico",
    "sportivo",
  ]);
  const [filteredEvents, setFilteredEvents] = useState<EventType[]>([]);
  const [showDropdown, setShowDropdown] = useState(false); // Stato per controllare l'apertura del dropdown

  // Estrae il numero dalla stringa "eta" e calcola startYear
  const calculateStartYear = (eta : string, endYear : number): number => {  
    // Estrae tutti i numeri dalla stringa
    const numbers = eta.match(/\d+/g);
    if (!numbers || numbers.length === 0) return 0;

    // Prende il primo numero trovato
    const age = parseInt(numbers[0]);
    if (isNaN(age)) return 0;

    return endYear - age;
  };

  const startYear = calculateStartYear(eta, endYear);
  if(startYear == 0){
    return (<></>)
  }

  const totalYears = endYear - startYear;
  const getPosition = (year: number) => ((year - startYear) / totalYears) * 100;

  // Funzione per selezionare al massimo 10 eventi distribuiti equamente
  const selectRandomEvents = (events: EventType[], categories: string[]): EventType[] => {
    const filtered = events.filter(e => categories.includes(e.category));
    
    if (filtered.length === 0) return [];

    const maxEvents = 10;
    const yearsPerSlot = Math.ceil(totalYears / maxEvents);
    
    const selected: EventType[] = [];

    for (let slotStart = startYear; slotStart <= endYear; slotStart += yearsPerSlot) {
      const slotEnd = Math.min(slotStart + yearsPerSlot - 1, endYear);
      const slotEvents = filtered.filter(e => e.year >= slotStart && e.year <= slotEnd);
      
      if (slotEvents.length > 0) {
        const randomEvent = slotEvents[Math.floor(Math.random() * slotEvents.length)];
        selected.push(randomEvent);
        
        if (selected.length >= maxEvents) {
          break;
        }
      }
    }

    return selected;
  };

  // Carica eventi dal JSON e inizializza history se vuota
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetch("/event_catalog.json");
        const data: EventType[] = await res.json();
        setAllEvents(data);

        // Se history è vuota, genera nuovi eventi e salvali in history
        if (history.length === 0) {
          const newEvents = selectRandomEvents(data, selectedCategories);
          setHistory(newEvents);
          setFilteredEvents(newEvents);
        } else {
          // Altrimenti usa gli eventi dalla history
          setFilteredEvents(history);
        }
      } catch (error) {
        console.error("Errore nel caricamento degli eventi:", error);
      }
    };
    loadEvents();
  }, [history, selectedCategories, setHistory]);

  // Gestione toggle categorie
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Applica filtro - rigenera eventi e aggiorna history e chiude il dropdown
  const applyFilter = () => {
    const newEvents = selectRandomEvents(allEvents, selectedCategories);
    setHistory(newEvents);
    setFilteredEvents(newEvents);
    setShowDropdown(false); // Chiudi il dropdown
  };

  // Funzione per generare tacche con numeri tondi (che finiscono con 5 o 10)
  const generateRoundedTicks = (): number[] => {
    const ticks: number[] = [];
    
    const firstTick = Math.ceil(startYear / 5) * 5;
    const lastTick = Math.floor(endYear / 5) * 5;
    const tickInterval = 50;
    
    for (let year = firstTick; year <= lastTick; year += tickInterval) {
      if (year % 5 === 0) {
        ticks.push(year);
      }
    }
    
    if (ticks.length < 2) {
      ticks.push(Math.ceil(startYear / 5) * 5);
      ticks.push(Math.floor(endYear / 5) * 5);
    }
    
    return ticks.sort((a, b) => a - b);
  };

  const ticks = generateRoundedTicks();

  const parseText = (text: string) => {
    const regex = /\*(.*?)\*/g;
    const parts = [];
    let lastIndex = 0;

    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(<em key={match.index}>{match[1]}</em>);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

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

  return (
      <div className="mt-2 mx-2">
        <p className="mb-1 text-center">Alcuni eventi successi durante la mia vita</p>
        <div className={styles.timelineContainer}>
          <div className={styles.timelineBar}>
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

            {filteredEvents.map((event, i) => {
              const percent = (event.year - startYear) / totalYears;
              const hoverColor = lerpColor("#4B301E", "#8BA96E", percent); 

              return (
                <OverlayTrigger
                  key={`${event.year}-${i}-${event.text}`}
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
                      boxShadow: `inset 0 0 0 2.5px ${hoverColor}`,
                    }}
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

        <div className="mt-3 pt-1 text-end">
          <DropdownButton 
            id="dropdown-categories" 
            title="Filtra tipologia eventi" 
            drop="start" 
            className={styles.dropdownCustom}
            show={showDropdown}
            onToggle={(isOpen) => setShowDropdown(isOpen)}
          >
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