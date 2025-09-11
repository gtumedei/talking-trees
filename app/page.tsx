"use client";

import { Container, Row, Col, OverlayTrigger, Tooltip, Card } from "react-bootstrap";
import Image from "next/image";
import styles from "./page.module.css";
import Title from "./Title";
import TimeLine from "./TimeLine";
import Link from "next/link";

export default function Home() {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 200;

  const events = [
    { year: startYear, text: "Rivoluzione Industriale" },
    { year: 1861, text: "Unità d’Italia" },
    { year: 1903, text: "Primo volo aereo" },
    { year: 1969, text: "Uomo sulla Luna" },
    { year: currentYear, text: "Oggi" },
  ];

  return (
    <main>
      <Container className={`${styles.page}`}>
        <Title text="Cipresso di San Francesco" level={1} className="text-center mt-3 display-6"/>
        <p className="text-muted text-end fst-italic m-0"> Emilia Romagna, Rimini, Verucchio</p>
        <Row>
          {/* Immagine albero */}
          <Col xs={5} className="m-0 p-0 text-center align-middle">
            <Image
              src="/01.L797.RN.08.png" // inserisci immagine in public/
              alt="Cipresso di San Francesco"
              fill   
              className={`${styles.treeImg} img-fluid}`}
            />
          </Col>

          {/* Info testo */}
          <Col xs={7} className={`${styles.treeInfo} m-0 pt-2 align-middle pe-2`}>
            <p className="fst-italic text-muted text-end tx-small mt-0 mb-3">
              In Emilia Romagna sono presenti  
              <strong> <a href="https://alberimonumentali.info/regioni/emilia-romagna" target="_blank">126 alberi monumentali</a></strong>, 
              di cui <strong>1 vicino a te</strong>.
            </p>
            <p className="mt-1">
              <strong>Specie: </strong> 
              <Link href="/treedetail">
                Cipresso comune <i>(Cupressus sempervirens L.)</i>
              </Link>
            </p>
            
            <p className="mt-2 fw-bold">Dimensioni</p>
            <ul>
              <li>Circonferenza fusto: 650 cm</li>
              <li>Altezza: 25 m</li>
            </ul>

            <p className="mt-1 fw-bold">Criteri di Monumentalità</p>
            <ul>
              <li>Architettura vegetale</li>
              <li>Età e/o dimensioni</li>
              <li>Pregio paesaggistico</li>
              <li>Valore storico, culturale, religioso</li>
            </ul>

            <p className="mt-1"><strong>Stima età:</strong> 800 anni</p>

            
          </Col>
        </Row>
        
        <TimeLine startYear={startYear} endYear={currentYear}/>
      </Container>
    </main>
  );
}
