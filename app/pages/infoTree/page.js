"use client";

import { Container, Row, Col, Card, Badge, ListGroup } from "react-bootstrap";
import { FaLeaf, FaTree, FaMapMarkerAlt, FaHeart, FaRecycle, FaHistory } from "react-icons/fa";
import { useContext } from "react";
import { UserContext } from "@/app/layout";
import styles from "./InfoTree.module.css";
import Title from "@/app/component/ui/Title";

export default function InfoTree() {
  const { userTree, userSpecies, document, history } = useContext(UserContext);

  if (!userTree || !document) {
    return (
      <Container className="text-center mt-5">
        <h2>Dati non disponibili</h2>
        <p>Impossibile caricare le informazioni dell'albero.</p>
      </Container>
    );
  }

  // --- PARSER DOCUMENTO ---
  const parseDocument = (docString) => {
    const sections = {};
    const lines = docString.split("\n");
    let currentSection = "";

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("DATI ")) {
        currentSection = trimmed.replace(":", "").trim();
        sections[currentSection] = [];
      } else if (currentSection && trimmed) {
        sections[currentSection].push(trimmed);
      }
    });

    const result = {};
    Object.keys(sections).forEach((section) => {
      result[section] = {};
      sections[section].forEach((line) => {
        if (line.startsWith("- ") || line.startsWith("Abbattimento")) {
          let clean = line.replace(/^- /, "");
          const parts = clean.split(": ");
          if (parts.length >= 2) {
            result[section][parts[0].trim()] = parts.slice(1).join(": ").trim();
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

  const parsed = parseDocument(document);

  const treeData = parsed["DATI ALBERO"] || {};
  const speciesData = parsed["DATI SPECIE BOTANICHE"] || {};
  const ecologicalData = parsed["DATI ECOLOGICI"] || {};
  const locationData = parsed["DATI LUOGO"] || {};
  const healthData = parsed["DATI SALUTE"] || {};
  const historicalData = parsed["DATI STORICI"] || {};

  // --- STORIA + ETÀ ---
  const enhancedHistoricalData = { ...historicalData };
  if (history && history.length > 0) {
    enhancedHistoricalData["Eventi Storici"] = history.map((e) => `${e.year}: ${e.text}`).join("; ");
  }

  // --- FUNZIONI ABBATTIMENTO ---
  const getCleanAbbattimentoValue = (value) => value?.split("→")[0].trim() || "";
  const getAbbattimentoComparisons = (value) =>
    value?.includes("→") ? value.split("→").slice(1).join("→").trim() : "";

  // --- EMOJI E DESCRIZIONI PER INQUINANTI ---
  const pollutantInfo = {
    "Abbattimento CO₂": {
      emoji: "🌱",
      descrizione: "La CO₂ è l’anidride carbonica, un gas serra che contribuisce al riscaldamento globale.",
    },
    "Abbattimento PM10": {
      emoji: "💨",
      descrizione: "Il PM10 è un insieme di particelle sottili sospese nell’aria, dannose per l’apparato respiratorio.",
    },
    "Abbattimento O₃": {
      emoji: "☀️",
      descrizione: "L’O₃ (ozono troposferico) è un inquinante secondario che si forma in presenza di sole e smog.",
    },
    "Abbattimento NO₂": {
      emoji: "🌫️",
      descrizione: "Il NO₂ (biossido di azoto) deriva dai gas di scarico e influisce sulla salute dei polmoni.",
    },
    "Abbattimento SO₂": {
      emoji: "🏭",
      descrizione: "Il SO₂ (biossido di zolfo) è prodotto da combustioni industriali e può causare piogge acide.",
    },
  };

  return (
    <Container className={styles.page}>
      <Title text="Info aggiuntive sul" level={1} className="text-center m-0" />
      <Title
        text={userTree["soprannome"] || userTree["specie nome volgare"]}
        level={2}
        className="text-center mb-3"
      />

      <Row className="g-3">
        {/* INFORMAZIONI TECNICHE */}
        <Col md={12}>
          <Card className={styles.card}>
            <Card.Header className={`${styles["bg-technical"]}`}>
              <strong>Informazioni Tecniche</strong>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <strong>Circonferenza:</strong> {userTree["circonferenza fusto (cm)"]} cm
                </Col>
                <Col md={6}>
                  <strong>Altezza:</strong> {userTree["altezza (m)"]} m
                </Col>
                {userTree["altitudine (m s.l.m.)"] && (
                  <Col md={6}>
                    <strong>Altitudine:</strong> {userTree["altitudine (m s.l.m.)"]} m s.l.m.
                  </Col>
                )}
                {userTree["eta_descrizione"] && (
                  <Col md={6}>
                    <strong>Età stimata:</strong> {userTree["eta_descrizione"]}
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* SPECIE BOTANICA */}
        <Col md={6}>
          <Card className={styles.card}>
            <Card.Header className={`${styles["bg-botanical"]} d-flex align-items-center`}>
              <FaLeaf className="me-2" />
              <strong>Specie Botanica</strong>
            </Card.Header>
            <Card.Body>
              <p>
                <strong>Nome scientifico:</strong> {userSpecies?.nome_specie}
              </p>
              <p>
                <strong>Nome comune:</strong> {userSpecies?.nome_comune}
              </p>
              <p>
                <strong>Famiglia:</strong> {userSpecies?.nome_famiglia}
              </p>
              <p>
                <strong>Portamento:</strong> {speciesData["Portamento"] || userSpecies?.info_portamento}
              </p>
              <p>
                <strong>Tipologia:</strong> {speciesData["Tipologia"] || userSpecies?.info_tipologia}
              </p>
              <p>
                <strong>Chioma:</strong>{" "}
                {speciesData["Chioma"] ||
                  `${userSpecies?.info_forma_chioma}, densità: ${userSpecies?.info_densita_chioma}`}
              </p>
              <p>
                <strong>Colori e fioritura:</strong>{" "}
                {speciesData["Colori autunnali"] ||
                  `${userSpecies?.info_colori_autunnali}, Fioritura: ${userSpecies?.info_fioritura}`}
              </p>
              <p>
                <strong>Habitat:</strong> {speciesData["Habitat"] || userSpecies?.habitat}
              </p>
              <p>
                <strong>Dimensioni tipiche:</strong>{" "}
                {speciesData["Dimensioni (specie)"] ||
                  `Altezza: ${userSpecies?.size_altezza} m, Chioma: ${userSpecies?.size_chioma}`}
              </p>
            </Card.Body>
          </Card>
        </Col>

        {/* DATI GEOGRAFICI */}
        <Col md={6}>
          <Card className={styles.card}>
            <Card.Header className={`${styles["bg-geographic"]} d-flex align-items-center`}>
              <FaMapMarkerAlt className="me-2" />
              <strong>Dati Geografici</strong>
            </Card.Header>
            <Card.Body>
              {locationData["Luogo"] && <p><strong>Località:</strong> {locationData["Luogo"]}</p>}
              {locationData["Popolazione"] && <p><strong>Popolazione:</strong> {locationData["Popolazione"]} abitanti</p>}
              {locationData["Superficie"] && <p><strong>Superficie:</strong> {locationData["Superficie"]} km²</p>}
              {locationData["Descrizione territorio"] && <p><strong>Territorio:</strong> {locationData["Descrizione territorio"]}</p>}
            </Card.Body>
          </Card>
        </Col>

        {/* IMPATTO ECOLOGICO */}
        <Col md={12}>
          <Card className={styles.card}>
            <Card.Header className={`${styles["bg-ecological"]} d-flex align-items-center`}>
              <FaRecycle className="me-2" />
              <strong>Impatto Ecologico</strong>
            </Card.Header>
            <Card.Body>
              {Object.entries(ecologicalData).map(([key, value]) => (
                <div key={key} className="mb-3">
                  <strong>{pollutantInfo[key]?.emoji || "🌿"} {key}:</strong>{" "}
                  {getCleanAbbattimentoValue(value)}
                  {getAbbattimentoComparisons(value) && (
                    <div className="small text-muted">
                      {getAbbattimentoComparisons(value)}
                    </div>
                  )}
                  {pollutantInfo[key] && (
                    <div className="small text-secondary">
                      {pollutantInfo[key].descrizione}
                    </div>
                  )}
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* STATO DI SALUTE */}
        <Col md={12}>
          <Card className={styles.card}>
            <Card.Header className={`${styles["bg-health"]} d-flex align-items-center`}>
              <FaHeart className="me-2" />
              <strong>Stato di Salute</strong>
            </Card.Header>
            <Card.Body>
              {healthData["Testo"] ? (
                <p className="text-center">{healthData["Testo"]}</p>
              ) : (
                <p className="text-muted text-center fst-italic">Dati non disponibili</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* STORIA E EVENTI */}
        {history && history.length > 0 && (
          <Col md={12}>
            <Card className={styles.card}>
              <Card.Header className={`${styles["bg-historical"]} d-flex align-items-center`}>
                <FaHistory className="me-2" />
                <strong>Storia ed Eventi</strong>
              </Card.Header>
              <Card.Body>
                {userTree["eta_descrizione"] && (
                  <div className="mb-3">
                    <strong>📅 Età stimata:</strong> {userTree["eta_descrizione"]}
                  </div>
                )}
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
            <Card className={styles.card}>
              <Card.Header className={`${styles["bg-description"]}`}>
                <strong>Descrizione e Storia</strong>
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
