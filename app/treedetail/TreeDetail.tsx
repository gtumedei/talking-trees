"use client";

import Image from "next/image";
import { Container, Row, Col } from "react-bootstrap";
import styles from "./TreeDetail.module.css";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

type TreeData = {
  commonName: string;
  latinName: string;
  description: string;
  environment?: string;
  species?: string;
  crownShape?: string;
  crownDensity?: string;
  crownSize?: string;
  habit?: string;
  floweringColor?: string;
  floweringSeason?: string;
  autumnLeaves?: string;
};

export default function TreeDetail() {
  const data = useContext(UserContext) as TreeData | null;

  if (!data) {
    return (
      <Container className="text-center mt-5">
        <h2>Nessun albero selezionato</h2>
        <p>Torna indietro e seleziona un albero dalla mappa.</p>
      </Container>
    );
  }

  const {
    commonName,
    latinName,
    description,
    environment,
    species,
    crownShape,
    crownDensity,
    crownSize,
    habit,
    floweringColor,
    floweringSeason,
    autumnLeaves,
  } = data;

  const characteristics = [
    { label: "Ambiente", value: environment, icon: "/icons/env.png" },
    { label: "Specie", value: species, icon: "/icons/species.png" },
    { label: "Forma chioma", value: crownShape, icon: "/icons/crown-shape.png" },
    { label: "Densità chioma", value: crownDensity, icon: "/icons/crown-density.png" },
    { label: "Taglia chioma", value: crownSize, icon: "/icons/crown-size.png" },
    { label: "Portamento", value: habit, icon: "/icons/habit.png" },
    { label: "Fioritura", value: floweringColor, icon: "/icons/flower.png" },
    { label: "Epoca fioritura", value: floweringSeason, icon: "/icons/season.png" },
    { label: "Foglie autunnali", value: autumnLeaves, icon: "/icons/autumn.png" },
  ].filter((c) => c.value);

  return (
    <Container className={styles.page}>
      <header className="text-center mb-4">
        <h2 className={styles.title}>{commonName}</h2>
        <p className={`${styles.subtitle} fst-italic`}>{latinName}</p>
      </header>

      <section className="mb-4">
        <p className={styles.sectionTitle}>Descrizione:</p>
        <p>{description}</p>
      </section>

      <Row className="g-3">
        {characteristics.map((c, i) => (
          <Col xs={12} sm={6} md={4} key={i}>
            <div className={styles.card}>
              {c.icon && (
                <Image
                  src={c.icon}
                  alt={c.label}
                  width={40}
                  height={40}
                  className={styles.icon}
                />
              )}
              <p className={styles.cardLabel}>{c.label}</p>
              <p className={styles.cardValue}>{c.value}</p>
            </div>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
