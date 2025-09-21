"use client";

import { Container, Row, Col, Button } from "react-bootstrap";
import { FaBookOpen, FaTree, FaCamera } from "react-icons/fa";
import Image from "next/image";
import styles from "./page.module.css";
import Title from "./Title";
import TimeLine from "./component/TimeLine";
import Link from "next/link";
import MapLink from "./component/PositionMap";
import { useContext } from "react";
import { UserContext } from "./layout";

export default function Tree() {
  const { userTree } = useContext(UserContext);
  
  // Se userTree non è disponibile, restituisci null
  if (!userTree) return null;

  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 200;

  // Funzione per gestire l'evento di caricamento della foto
  const handlePhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      alert(`📸 Foto scattata: ${file.name}`);
    }
  };

  return (
    <Container className={styles.page}>
      {/* Titolo: soprannome se presente, altrimenti specie volgare */}
      <Title
        text={userTree["soprannome"] || userTree["specie nome volgare"]}
        level={1}
        className="text-center mt-3 mb-0 display-6"
      />

      {/* Nome scientifico se disponibile */}
      {userTree["specie nome scientifico"] && (
        <p className="text-center fst-italic">
          <Link href="/treedetail">{userTree["specie nome scientifico"]}</Link>
        </p>
      )}

      <p className="text-muted text-end fst-italic m-0">
        {userTree["comune"]}, {userTree["provincia"]}, {userTree["regione"]}
      </p>

      <Row>
        {/* Immagine albero (se presente nel dataset) */}
        <Col xs={5} className="m-0 p-0 text-center align-middle">
          {userTree.image ? (
            <Image
              src={userTree.image}
              alt={userTree["soprannome"] || userTree["specie nome volgare"]}
              fill
              className={`${styles.treeImg} img-fluid`}
            />
          ) : (
            <div className={styles.noImage}>Nessuna immagine</div>
          )}
        </Col>

        {/* Info testo */}
        <Col xs={7} className={`${styles.treeInfo} m-0 align-middle pe-2`}>
          <p className="fst-italic text-muted text-end tx-small m-0">
            In {userTree["regione"]} sono presenti
            <strong>
              {" "}
              <a
                href={`https://alberimonumentali.info/regioni/${userTree["regione"].toLowerCase()}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                alberi monumentali
              </a>
            </strong>
            , di cui <strong>1 vicino a te</strong>.
          </p>

          {/* Mappa link */}
          {userTree.lat && userTree.lng && (
            <MapLink
              lat={parseFloat(userTree.lat)}
              lng={parseFloat(userTree.lng)}
              label=">> Vedi posizione"
              className="tx-small text-end w-100 mt-0 mb-3"
            />
          )}

          {/* Dimensioni */}
          <p className="mt-2 fw-bold">Dimensioni</p>
          <ul>
            <li>Circonferenza fusto: {userTree["circonferenza fusto (cm)"]} cm</li>
            <li>Altezza: {userTree["altezza (m)"]} m</li>
            {userTree["altitudine (m s.l.m.)"] && (
              <li>Altitudine: {userTree["altitudine (m s.l.m.)"]} m s.l.m.</li>
            )}
          </ul>

          {/* Criteri di Monumentalità */}
          <p className="mt-1 fw-bold">Criteri di Monumentalità</p>
          <ul>
            {userTree["criteri di monumentalità"]
              ?.split("-")
              .map((c, i) => <li key={i}>{c}</li>)}
          </ul>

          {/* Età stimata */}
          {userTree["eta_descrizione"] && (
            <p className="mt-1">
              <strong>Stima età:</strong> {userTree["eta_descrizione"]}
            </p>
          )}
        </Col>
      </Row>

      {/* Timeline */}
      <TimeLine startYear={startYear} endYear={currentYear} />

      {/* Bottone di navigazione */}
      <div className="w-100 d-flex justify-content-around">
        <Button
          as={Link}
          href="/diary"
          variant="secondary"
          className="mt-3 mb-5 fw-bold d-flex align-items-center gap-2"
        >
          <FaBookOpen /> Pezzi di storia
        </Button>
        <Button
          as={Link}
          href="/chatbot"
          variant="secondary"
          className="mt-3 mb-5 fw-bold d-flex align-items-center gap-2"
        >
          <FaTree /> Parla con l'albero
        </Button>
      </div>

      {/* Bottone per fare foto in basso a sinistra */}
      <div className={styles.photoWrapper}>
        <Button
          variant="light"
          className={styles.photoButton}
          onClick={() => document.getElementById("cameraInput")?.click()}
        >
          <FaCamera size={22} />
        </Button>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          id="cameraInput"
          style={{ display: "none" }}
          onChange={handlePhoto}
        />
      </div>
    </Container>
  );
}
