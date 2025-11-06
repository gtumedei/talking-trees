"use client";

import { Container, Row, Col, Card, Badge, ListGroup } from "react-bootstrap";
import {
  FaLeaf,
  FaTree,
  FaMapMarkerAlt,
  FaHeart,
  FaRecycle,
  FaHistory,
} from "react-icons/fa";
import { useContext } from "react";
import { UserContext } from "@/app/layout";
import styles from "./InfoTree.module.css";
import Title from "@/app/component/ui/Title";

export default function InfoTree() {
  const { userTree, document, history } = useContext(UserContext);

  if (!userTree || !document) {
    return (
      <Container className="text-center mt-5" style={{ fontFamily: "Arial", fontSize: "12px" }}>
        <h2>Dati non disponibili</h2>
        <p>Impossibile caricare le informazioni dell'albero.</p>
      </Container>
    );
  }

  // --- Parsing del documento ---
  const parseDocument = (docString) => {
    const sections = {};
    const lines = docString.split("\n");
    let currentSection = "";

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("DATI ")) {
        currentSection = trimmedLine.replace(":", "").trim();
        sections[currentSection] = [];
      } else if (currentSection && trimmedLine) {
        sections[currentSection].push(trimmedLine);
      }
    });

    const result = {};
    Object.keys(sections).forEach((section) => {
      result[section] = {};
      sections[section].forEach((line) => {
        if (line.startsWith("- ") || line.startsWith("Abbattimento") || line.startsWith("-Abbattimento")) {
          let cleanLine = line.replace(/^- /, "").replace(/^-/, "");
          const parts = cleanLine.split(": ");
          if (parts.length >= 2) {
            result[section][parts[0].trim()] = parts.slice(1).join(": ").trim();
          } else {
            result[section][cleanLine] = cleanLine;
          }
        } else if (section === "DATI ALBERO") {
          result[section]["Descrizione"] = (result[section]["Descrizione"] || "") + "\n" + line;
        } else if (section === "DATI SALUTE") {
          result[section]["Testo"] = (result[section]["Testo"] || "") + " " + line;
        }
      });
    });

    return result;
  };

  const parsedDocument = parseDocument(document);

  const treeData = parsedDocument["DATI ALBERO"] || {};
  const speciesData = parsedDocument["DATI SPECIE BOTANICHE"] || {};
  const ecologicalData = parsedDocument["DATI ECOLOGICI"] || {};
  const locationData = parsedDocument["DATI LUOGO"] || {};
  const healthData = parsedDocument["DATI SALUTE"] || {};
  const historicalData = parsedDocument["DATI STORICI"] || {};

  const etaText = userTree["eta"] || "età sconosciuta";
  const enhancedHistoricalData = { ...historicalData };
  if (history && history.length > 0) {
    const eventsText = history.map((e) => `${e.year}: ${e.text}`).join("; ");
    enhancedHistoricalData["Eventi Storici"] = eventsText;
  }

  const getCleanAbbattimentoValue = (value) => value?.split("→")[0].trim() || "";
  const getAbbattimentoComparisons = (value) =>
    value?.includes("→") ? value.split("→").slice(1).join("→").trim() : "";

  const ecoDescriptions = {
    "Abbattimento CO₂":
      "La CO₂ (anidride carbonica) è il principale gas serra prodotto dalla combustione. Gli alberi la assorbono e riducono l’effetto serra.",
    "Abbattimento PM10":
      "Il PM10 è un insieme di polveri sottili prodotte da traffico e riscaldamento. È pericoloso per i polmoni e la salute respiratoria.",
    "Abbattimento O₃":
      "L’ozono (O₃) a livello del suolo è un inquinante che irrita le vie respiratorie. Gli alberi aiutano a ridurne la concentrazione.",
    "Abbattimento NO₂":
      "Il biossido di azoto (NO₂) è generato dai motori e causa smog. Le piante contribuiscono a purificare l’aria.",
    "Abbattimento SO₂":
      "Il biossido di zolfo (SO₂) proviene da combustioni industriali e può danneggiare i polmoni e le piante stesse.",
  };

  const ecoEmojis = {
    "Abbattimento CO₂": "🌱",
    "Abbattimento PM10": "💨",
    "Abbattimento O₃": "☀️",
    "Abbattimento NO₂": "🌫️",
    "Abbattimento SO₂": "🏭",
  };

  return (
    <Container className={styles.page}>
      <Title text="Info aggiuntive sul" level={1} className="text-center m-0" />
      <Title text={userTree["soprannome"] || userTree["specie nome volgare"]} level={2} className="text-center mb-3" />

      <Row className="g-3">
        {/* INFORMAZIONI TECNICHE */}
        <Col md={12}>
          <Card className={`${styles.card} mx-2`}>
            <Card.Header className={`${styles["card-header"]} ${styles["bg-technical"]}`}>
              <strong>Informazioni tecniche</strong>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}><strong>Circonferenza:</strong> {userTree["circonferenza fusto (cm)"]} cm</Col>
                <Col md={6}><strong>Altezza:</strong> {userTree["altezza (m)"]} m</Col>
                {userTree["altitudine (m s.l.m.)"] && (
                  <Col md={6}><strong>Altitudine:</strong> {userTree["altitudine (m s.l.m.)"]} m s.l.m.</Col>
                )}
              </Row>

              {userTree["criteri di monumentalità"] && (
                <div className="mt-3">
                  <strong>Criteri di Monumentalità:</strong>
                  <ul className="mt-2">
                    {userTree["criteri di monumentalità"]
                      .replace(/^-/, "")
                      .split("-")
                      .map((criterio, index) => (
                        <li key={index}>{criterio.trim()}</li>
                      ))}
                  </ul>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* DATI LUOGO */}
        <Col md={6}>
          <Card className={`${styles.card} mx-2`}>
            <Card.Header className={`${styles["card-header"]} ${styles["bg-geographic"]} d-flex align-items-center`}>
              <FaMapMarkerAlt className="me-2" />
              <strong>Dati geografici</strong>
            </Card.Header>
            <Card.Body>
              {locationData["Luogo"] && <p><strong>Località:</strong> {locationData["Luogo"]}</p>}
              {locationData["Popolazione"] && <p><strong>Popolazione:</strong> {locationData["Popolazione"]} abitanti</p>}
              {locationData["Superficie"] && <p><strong>Superficie:</strong> {locationData["Superficie"]} km²</p>}
              {locationData["Descrizione territorio"] && (
                <p><strong>Territorio:</strong> {locationData["Descrizione territorio"]}</p>
              )}
              {locationData["Contesto storico"] && (
                <p><strong>Contesto storico:</strong> {locationData["Contesto storico"]}</p>
              )}
              {locationData["Contesto culturale"] && (
                <p><strong>Contesto culturale:</strong> {locationData["Contesto culturale"]}</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* IMPATTO ECOLOGICO */}
        <Col md={6}>
          <Card className={`${styles.card} mx-2`}>
            <Card.Header className={`${styles["card-header"]} ${styles["bg-ecological"]} d-flex align-items-center`}>
              <FaRecycle className="me-2" />
              <strong>Impatto ecologico</strong>
            </Card.Header>
            <Card.Body>
              {Object.entries(ecologicalData).map(([key, value]) => (
                <div key={key} className="mb-3 p-2 rounded bg-light">
                  <strong>{ecoEmojis[key] ? `${ecoEmojis[key]} ${key}` : key}:</strong>{" "}
                  <div className={`small text-muted mt-1 mb-0 ${styles.pollutionInfo}`}>
                    {ecoDescriptions[key] || ""}
                  </div>
                  {getCleanAbbattimentoValue(value)}
                  {getAbbattimentoComparisons(value) && (
                    <div className="small text-muted">{getAbbattimentoComparisons(value)}</div>
                  )}
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* STATO DI SALUTE */}
        <Col md={12}>
          <Card className={`${styles.card} mx-2`}>
            <Card.Header className={`${styles["card-header"]} ${styles["bg-health"]} d-flex align-items-center`}>
              <FaHeart className="me-2" />
              <strong>Stato di salute</strong>
            </Card.Header>
            <Card.Body>
              {healthData["Testo"] ? (
                <p className={`${styles["health-text"]} text-center`}>{healthData["Testo"]}</p>
              ) : (
                <p className="text-muted text-center fst-italic">Dati non disponibili</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* STORIA ED EVENTI */}
        {history && history.length > 0 && (
          <Col md={12}>
            <Card className={`${styles.card} mx-2`}>
              <Card.Header className={`${styles["card-header"]} ${styles["bg-historical"]} d-flex align-items-center`}>
                <FaHistory className="me-2" />
                <strong>Eventi durante avvenuti durante la mia vita</strong>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <strong className="h6">Età stimata:</strong> {etaText}
                </div>
                <ListGroup variant="flush">
                  {history.map((event, index) => (
                    <ListGroup.Item key={index} className="px-0">
                      <Badge bg="secondary" className="me-2">{event.year}</Badge>
                      <strong>{event.text}</strong>
                      <div className="text-muted small">Categoria: {event.category}</div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* DESCRIZIONE */}
        {treeData["Descrizione"] && (
          <Col md={12}>
            <Card className={`${styles.card} mx-2`}>
              <Card.Header className={`${styles["card-header"]} ${styles["bg-description"]}`}>
                <strong>Descrizione e storia</strong>
              </Card.Header>
              <Card.Body>
                <Card.Text className="fst-italic text-dark" style={{ whiteSpace: "pre-line" }}>
                  {treeData["Descrizione"]}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
}
