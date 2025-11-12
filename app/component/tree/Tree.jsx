"use client";

import { Container, Row, Col, Button } from "react-bootstrap";
import { FaBookOpen, FaTree, FaCamera, FaInfoCircle } from "react-icons/fa";
import Image from "next/image";
import styles from "./Tree.module.css";
import Title from "@component/ui/Title";
import TimeLine from "@component/timeline/TimeLine";
import Link from "next/link";
import MapLink from "@component/maps/PositionMap";
import { useContext, useState, useEffect } from "react";
import { UserContext } from "@/app/layout";
import HealthStatus from "@component/ui/HealthStatus";


export default function Tree({ variant = "statico" }) {
  const { userTree } = useContext(UserContext);
  const [imageSrc, setImageSrc] = useState("/tree/tree-default.png");
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Precarica e verifica l'immagine
  useEffect(() => {
    const checkImageExists = async () => {
      const treeId = userTree?.["id scheda"];
      if (!treeId) {
        setImageSrc("/tree/tree-default.png");
        return;
      }

      const potentialImageSrc = `/tree/${treeId.replaceAll('/', '.')}.png`;
      
      try {
        const response = await fetch(potentialImageSrc, { method: 'HEAD' });
        if (response.ok) {
          setImageSrc(potentialImageSrc);
        } else {
          setImageSrc("/tree/tree-default.png");
        }
      } catch {
        console.log("Immagine non trovata, uso default");
        setImageSrc("/tree/tree-default.png");
      }
    };

    if (userTree) {
      checkImageExists();
    }
  }, [userTree]);

  const handlePhoto = () => {
    alert("📸 Funzionalità foto attivata!");
  };

  const handleImageError = () => {
    console.log("Errore nel caricamento dell'immagine, uso default");
    setImageSrc("/tree/tree-default.png");
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Configurazione in base alla variante
  const getTreeConfig = () => {
    switch (variant) {
      case "chatbot-scientifico":
        return {
          treeButtonText: "Parla con l'albero",
          treeButtonIcon: <FaTree />,
          treeButtonHref: "/pages/chatbot?variant=scientifico",
          treeButtonClass: "green"
        };
      case "chatbot-narrativo":
        return {
          treeButtonText: "Parla con l'albero",
          treeButtonIcon: <FaTree />,
          treeButtonHref: "/pages/chatbot?variant=narrativo"
        };
      case "statico":
      default:
        return {
          treeButtonText: "Informazioni sull'albero",
          treeButtonIcon: <FaInfoCircle />,
          treeButtonHref: "/pages/infoTree"
        };
    }
  };

  const treeConfig = getTreeConfig();

  if (!userTree) return null;

  const currentYear = new Date().getFullYear();
  
  // Estrae il numero dalla stringa "eta" e calcola startYear
  const calculateStartYear = () => {
    if (!userTree["eta"]) return null;
    
    // Estrae tutti i numeri dalla stringa
    const numbers = userTree["eta"].match(/\d+/g);
    if (!numbers || numbers.length === 0) return null;
    
    // Prende il primo numero trovato
    const age = parseInt(numbers[0]);
    if (isNaN(age)) return null;
    
    return currentYear - age;
  };

  const startYear = calculateStartYear();
  const hasTimeline = userTree["eta"] && startYear !== null;

  // Determina la classe CSS in base al tipo di immagine
  const imageClass = imageSrc === "/tree/tree-default.png" 
    ? styles.treeImgDef 
    : styles.treeImg;

  return (
    <Container className={styles.page}>
      {/* Titolo */}
      <Title
        text={userTree["soprannome"] || userTree["specie nome volgare"]}
        level={1}
        className="text-center mt-3 mb-0 display-6"
      />

      {/* Nome scientifico */}
      {userTree["specie nome scientifico"] && (
        <p className="text-center fst-italic">
          {userTree["index_specie"] === "" ? (
            <span>userTree["specie nome scientifico"]</span>
          ) : (
            <Link href="/pages/specie" className={styles.nameLink}>{userTree["specie nome scientifico"]}</Link>
          )}
        </p>
      )}

      <p className="text-muted text-end fst-italic m-0">
        {userTree["comune"]}, {userTree["provincia"]}, {userTree["regione"]}
      </p>

      <Row>
        {/* Immagine albero - MANTENUTO COME ORIGINALE */}
        <Col xs={5} className="m-0 p-0 text-center colInfo">
          <div className={styles.imageContainer}>
            <Image
              src={imageSrc}
              alt={userTree["soprannome"] || userTree["specie nome volgare"]}
              width={300}
              height={400}
              className={`${imageClass} img-fluid`}
              onError={handleImageError}
              onLoad={handleImageLoad}
              priority
            />
            {!imageLoaded && (
              <div className={styles.imagePlaceholder}>
                Caricamento immagine...
              </div>
            )}
          </div>
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

          {/* Stato di salute attuale */}
          {userTree["status_salute"] &&
            <div className="d-flex justify-content-between align-items-center mb-2">
              <p className="mt-2 fw-bold mb-0">Stato di salute {userTree["status_salute"]}</p>
            </div>
          }

          {/* Dimensioni */}
          <p className="mt-2 fw-bold">Dimensioni</p>
          <ul className="list-unstyled">
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
               ?.replace(/^-/, "")
               .split("-")
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

      {/* Bottone salute*/}
      <HealthStatus />

      {/* Timeline - MOSTRATA SOLO SE È PRESENTE IL CAMPO "eta" */}
      {hasTimeline && (
        <TimeLine startYear={startYear} endYear={currentYear} />
      )}

      {/* Bottone di navigazione */}
      <div className="w-100 d-flex justify-content-around">
        <Button as={Link} href="/pages/diary" variant="primary"
          className="mt-3 mb-5 fw-bold d-flex align-items-center gap-2 flame"
        >
          <FaBookOpen /> Pezzi di storia
        </Button>
        <Button as={Link} href={treeConfig.treeButtonHref} variant="primary"
          className={`mt-3 mb-5 fw-bold d-flex align-items-center gap-2 green`}
        >
          {treeConfig.treeButtonIcon} {treeConfig.treeButtonText}
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