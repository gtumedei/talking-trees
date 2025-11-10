"use client";

import { Container, Row, Col, Card, Badge, ListGroup } from "react-bootstrap";
import { FaLeaf, FaTree, FaMapMarkerAlt, FaHeart, FaRecycle, FaHistory } from "react-icons/fa";
import { useContext } from "react";
import { UserContext } from "@/app/layout";
import styles from "./InfoTree.module.css";
import Title from "@/app/component/ui/Title";
import BackButton from "@component/ui/BackButton";

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

  // --- PARSER DELLA NUOVA STRUTTURA RAG ---
  const parseRAGStructure = (ragStructure) => {
    const result = {};
    
    if (!ragStructure.sections || !Array.isArray(ragStructure.sections)) {
      return result;
    }

    // Raggruppa le sezioni per tipo
    ragStructure.sections.forEach(section => {
      const sectionType = section.type;
      
      if (!result[sectionType]) {
        result[sectionType] = {};
      }

      // Processa il contenuto della sezione in base al tipo
      switch(sectionType) {
        case 'DATI_ALBERO':
          result[sectionType] = parseTreeSection(section.content);
          break;
        case 'DATI_BOTANICI':
          result[sectionType] = parseBotanicalSection(section.content);
          break;
        case 'DATI_ECOLOGICI':
          result[sectionType] = parseEcologicalSection(section.content);
          break;
        case 'DATI_LUOGO':
          result[sectionType] = parseLocationSection(section.content);
          break;
        case 'DATI_METEOROLOGICI':
          result[sectionType] = parseWeatherSection(section.content);
          break;
        case 'DATI_STORICI':
          result[sectionType] = parseHistoricalSection(section.content);
          break;
        default:
          result[sectionType] = { "Contenuto": section.content };
      }
    });

    return result;
  };

  // Funzioni di parsing per ogni tipo di sezione
  const parseTreeSection = (content) => {
    const lines = content.split('\n');
    const data = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        data[key.trim()] = valueParts.join(':').trim();
      }
    });
    
    return data;
  };

  const parseBotanicalSection = (content) => {
    const lines = content.split('\n');
    const data = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        data[key.trim()] = valueParts.join(':').trim();
      }
    });
    
    return data;
  };

  const parseEcologicalSection = (content) => {
    const lines = content.split('\n');
    const data = {};
    
    lines.forEach(line => {
      if (line.startsWith('Abbattimento')) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          data[key.trim()] = valueParts.join(':').trim();
        }
      }
    });
    
    return data;
  };

  const parseLocationSection = (content) => {
    const lines = content.split('\n');
    const data = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        data[key.trim()] = valueParts.join(':').trim();
      }
    });
    
    return data;
  };

  const parseWeatherSection = (content) => {
    return { "Testo": content };
  };

  const parseHistoricalSection = (content) => {
    const data = {};
    if (content.includes(':')) {
      const [key, value] = content.split(':');
      data[key.trim()] = value.trim();
    } else {
      data["Età"] = content;
    }
    return data;
  };

  // --- MAPPING DELLE SEZIONI PER COMPATIBILITÀ ---
  const mapRAGSectionsToLegacyFormat = (parsedData) => {
    return {
      "DATI ALBERO": parsedData["DATI_ALBERO"] || {},
      "DATI SPECIE BOTANICHE": parsedData["DATI_BOTANICI"] || {},
      "DATI ECOLOGICI": parsedData["DATI_ECOLOGICI"] || {},
      "DATI LUOGO": parsedData["DATI_LUOGO"] || {},
      "DATI SALUTE": parsedData["DATI_METEOROLOGICI"] || {},
      "DATI STORICI": parsedData["DATI_STORICI"] || {}
    };
  };

  // Parsing della struttura RAG
  const parsedRAG = parseRAGStructure(document);
  const parsed = mapRAGSectionsToLegacyFormat(parsedRAG);

  // Estrazione dati per compatibilità
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
      descrizione: "La CO₂ è l'anidride carbonica, un gas serra che contribuisce al riscaldamento globale.",
    },
    "Abbattimento PM10": {
      emoji: "💨",
      descrizione: "Il PM10 è un insieme di particelle sottili sospese nell'aria, dannose per l'apparato respiratorio.",
    },
    "Abbattimento O₃": {
      emoji: "☀️",
      descrizione: "L'O₃ (ozono troposferico) è un inquinante secondario che si forma in presenza di sole e smog.",
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

  // --- RENDER DELLE SEZIONI DINAMICHE ---
  const renderSectionIfData = (sectionData, renderFunction) => {
    if (!sectionData || Object.keys(sectionData).length === 0) return null;
    return renderFunction();
  };

  return (
    <Container className={styles.page}>
      <BackButton />
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
                {treeData["Nome"] && (
                  <Col md={6}>
                    <strong>Nome:</strong> {treeData["Nome"]}
                  </Col>
                )}
                {treeData["Dimensioni"] && (
                  <Col md={6}>
                    <strong>Dimensioni:</strong> {treeData["Dimensioni"]}
                  </Col>
                )}
                {treeData["Criteri di monumentalità"] && (
                  <Col md={12}>
                    <strong>Criteri di monumentalità:</strong> {treeData["Criteri di monumentalità"]}
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* SPECIE BOTANICA */}
        {renderSectionIfData(speciesData, () => (
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
                {speciesData["Portamento"] && (
                  <p>
                    <strong>Portamento:</strong> {speciesData["Portamento"]}
                  </p>
                )}
                {speciesData["Tipologia"] && (
                  <p>
                    <strong>Tipologia:</strong> {speciesData["Tipologia"]}
                  </p>
                )}
                {speciesData["Chioma"] && (
                  <p>
                    <strong>Chioma:</strong> {speciesData["Chioma"]}
                  </p>
                )}
                {speciesData["Colori autunnali"] && (
                  <p>
                    <strong>Colori e fioritura:</strong> {speciesData["Colori autunnali"]}
                  </p>
                )}
                {speciesData["Habitat"] && (
                  <p>
                    <strong>Habitat:</strong> {speciesData["Habitat"]}
                  </p>
                )}
                {speciesData["Dimensioni tipiche"] && (
                  <p>
                    <strong>Dimensioni tipiche:</strong> {speciesData["Dimensioni tipiche"]}
                  </p>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}

        {/* DATI GEOGRAFICI */}
        {renderSectionIfData(locationData, () => (
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
                {locationData["Contesto storico"] && <p><strong>Contesto storico:</strong> {locationData["Contesto storico"]}</p>}
                {locationData["Contesto culturale"] && <p><strong>Contesto culturale:</strong> {locationData["Contesto culturale"]}</p>}
              </Card.Body>
            </Card>
          </Col>
        ))}

        {/* IMPATTO ECOLOGICO */}
        {renderSectionIfData(ecologicalData, () => (
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
        ))}

        {/* STATO DI SALUTE */}
        {renderSectionIfData(healthData, () => (
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
        ))}

        {/* STORIA E EVENTI */}
        {(history && history.length > 0) || Object.keys(historicalData).length > 0 ? (
          <Col md={12}>
            <Card className={styles.card}>
              <Card.Header className={`${styles["bg-historical"]} d-flex align-items-center`}>
                <FaHistory className="me-2" />
                <strong>Storia ed Eventi</strong>
              </Card.Header>
              <Card.Body>
                {historicalData["Età"] && (
                  <div className="mb-3">
                    <strong>📅 Età stimata:</strong> {historicalData["Età"]}
                  </div>
                )}
                {enhancedHistoricalData["Eventi Storici"] && (
                  <div className="mb-3">
                    <strong>Eventi storici:</strong> {enhancedHistoricalData["Eventi Storici"]}
                  </div>
                )}
                {history && history.length > 0 && (
                  <ListGroup variant="flush">
                    {history.map((event, index) => (
                      <ListGroup.Item key={index} className="px-0">
                        <Badge bg="secondary" className="me-2">{event.year}</Badge>
                        <strong>{event.text}</strong>
                        <div className="text-muted small">Categoria: {event.category}</div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>
        ) : null}

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