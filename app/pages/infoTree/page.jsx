"use client";

import { Container, Row, Col, Card, Badge, ListGroup } from "react-bootstrap";
import { FaLeaf, FaTree, FaMapMarkerAlt, FaHeart, FaRecycle, FaHistory } from "react-icons/fa";
import { useContext } from "react";
import { UserContext } from "@/app/layout";
import styles from "./InfoTree.module.css";
import Title from "@/app/component/ui/Title";
import BackButton from "@component/ui/BackButton";

export default function InfoTree() {
  const { document } = useContext(UserContext);
  console.log(document)

  if (!document) {
    return (
      <Container className="text-center mt-5">
        <h2>Dati non disponibili</h2>
        <p>Impossibile caricare le informazioni dell'albero.</p>
      </Container>
    );
  }

  // Estrae i contenuti delle varie sezioni
  const getSection = (id) => document.sections?.find((s) => s.id === id)?.content || {};

  const albero = getSection("tree_data");
  const descrizione = document.sections?.find((s) => s.id === "tree_description")?.content || "";
  const specie = getSection("species_data");
  const ecologia = getSection("ecological_data");
  const luogo = getSection("place_data");
  const salute = getSection("health_data");
  const storia = getSection("historical_data");

  // Dati formattati
  const criteri = albero?.criteri || "N/D";
  const circonferenza = albero?.circonferenza ? albero.circonferenza : "N/D";
  const altezza = albero?.altezza ? albero.altezza : "N/D";

  const chioma =
    specie?.chioma?.forma || specie?.chioma?.densità
      ? `${specie.chioma.forma || ""} (${specie.chioma.densità || ""})`
      : "N/D";

  const dimensioniSpecie = specie?.dimensioni_specie
    ? `(Altezza: ${specie.dimensioni_specie.altezza_m}, Chioma: ${specie.dimensioni_specie.chioma})`
    : "N/D";

  const ecologicalEntries = Object.entries(ecologia || {}).filter(([_, v]) => v);
  const eventiStorici = storia?.eventi?.length ? storia.eventi : [];

  // --- Info inquinanti ---
  const pollutantInfo = {
    "CO₂": { emoji: "🌱", descrizione: "Riduce la concentrazione di anidride carbonica (gas serra)." },
    "PM10": { emoji: "💨", descrizione: "Filtra le polveri sottili sospese nell’aria." },
    "O₃": { emoji: "☀️", descrizione: "Contribuisce a ridurre l’ozono troposferico." },
    "NO₂": { emoji: "🌫️", descrizione: "Assorbe biossido di azoto, migliorando la qualità dell’aria." },
    "SO₂": { emoji: "🏭", descrizione: "Contrasta il biossido di zolfo derivante dalle attività industriali." }
  };

  return (
    <Container className={styles.page}>
      <BackButton />
      <Title text="Info aggiuntive sul" level={1} className="text-center m-0" />
      <Title text={document.name} level={2} className="text-center mb-3" />

      <Row className="g-3">

        {/* DATI TECNICI */}
        <Col md={12}>
          <Card className={styles.card}>
            <Card.Header className={styles["bg-technical"]}>
              <strong>Informazioni Tecniche</strong>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}><strong>Altezza:</strong> {altezza}</Col>
                <Col md={6}><strong>Circonferenza:</strong> {circonferenza}</Col>
                <Col md={12} className="mt-2">
                  <strong>Criteri di monumentalità:</strong> {criteri}
                </Col>
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
              <p><strong>Specie:</strong> {specie.nome_comune} - (<i>{specie.nome_scientifico}</i>)</p>
              <p><strong>Caratteristiche specie:</strong> portamento {specie.portamento}, {specie.tipologia}, Chioma: {chioma}</p>
              <p><strong>Colori autunnali:</strong> {specie.colori_autunnali}</p>
              <p><strong>Frutti:</strong> {specie.frutti}</p>
              <p><strong>Fioritura:</strong> {specie.fioritura}</p>
              <p><strong>Habitat specie:</strong> {specie.habitat}</p>
              <p><strong>Dimensioni (specie):</strong> {dimensioniSpecie}</p>
            </Card.Body>
          </Card>
        </Col>

        {/* DATI LUOGO */}
        <Col md={6}>
          <Card className={styles.card}>
            <Card.Header className={`${styles["bg-geographic"]} d-flex align-items-center`}>
              <FaMapMarkerAlt className="me-2" />
              <strong>Dati Luogo</strong>
            </Card.Header>
            <Card.Body>
              <p>
                <strong>Luogo:</strong> (comune: {luogo.comune}), (Provincia: {luogo.provincia}), (Regione: {luogo.regione})
                {luogo.popolazione && luogo.superficie_km2 && (
                  <> (Popolazione: {luogo.popolazione} abitanti, Superficie: {luogo.superficie_km2} km²)</>
                )}
              </p>
              <p><strong>Descrizione luogo territorio:</strong> {luogo.descrizione}</p>
              <p><strong>Contesto storico luogo:</strong> {luogo.contesto_storico}</p>
              <p><strong>Contesto culturale luogo:</strong> {luogo.contesto_culturale}</p>
            </Card.Body>
          </Card>
        </Col>

        {/* DATI ECOLOGICI */}
        {ecologicalEntries.length > 0 && (
          <Col md={12}>
            <Card className={styles.card}>
              <Card.Header className={`${styles["bg-ecological"]} d-flex align-items-center`}>
                <FaRecycle className="me-2" />
                <strong>Impatto Ecologico</strong>
              </Card.Header>
              <Card.Body>
                {ecologicalEntries.map(([key, value]) => {
                  const base = key.replace("Abbattimento ", "");
                  const info = pollutantInfo[base] || {};
                  return (
                    <div key={key} className="mb-2">
                      <strong>{info.emoji || "🌿"} Abbattimento {key}:</strong> {value.valore.replace("Abbattimento ", "").replace(key, "")}
                      {value.descrizione?.descrizione && (
                        <div className="small text-secondary text-center">{value.descrizione.descrizione}</div>
                      )}
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* SALUTE */}
        <Col md={12}>
          <Card className={styles.card}>
            <Card.Header className={`${styles["bg-health"]} d-flex align-items-center`}>
              <FaHeart className="me-2" />
              <strong>Stato di Salute</strong>
            </Card.Header>
            <Card.Body>
              <p><strong>Stato:</strong> {salute.stato || "Non specificato"}</p>
              <p><strong>Condizioni meteorologiche:</strong> {salute.condizioni_meteo || "N/D"}</p>
            </Card.Body>
          </Card>
        </Col>

        {/* STORIA */}
        <Col md={12}>
          <Card className={styles.card}>
            <Card.Header className={`${styles["bg-historical"]} d-flex align-items-center`}>
              <FaHistory className="me-2" />
              <strong>Storia ed Eventi</strong>
            </Card.Header>
            <Card.Body>
              <p><strong>Età stimata:</strong> {storia.eta}</p>
              
            </Card.Body>
          </Card>
        </Col>

        {/* DESCRIZIONE ALBERO */}
        {descrizione && (
          <Col md={12}>
            <Card className={styles.card}>
              <Card.Header className={`${styles["bg-description"]}`}>
                <strong>Descrizione</strong>
              </Card.Header>
              <Card.Body>
                <Card.Text className="fst-italic text-dark" style={{ whiteSpace: "pre-line" }}>
                  {descrizione}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
}
