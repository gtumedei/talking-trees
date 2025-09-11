"use client";

import Image from "next/image";
import { Container, Row, Col } from "react-bootstrap";
import styles from "./TreeDetail.module.css";

type Feature = {
  icon?: string;     // es: "/icons/crown-shape.svg" (in /public/icons)
  emoji?: string;    // fallback se non hai l'icona
  label: string;     // es: "Forma chioma"
  value: string;     // es: "Fastigiata"
};

type TreeData = {
  commonName: string;     // es: "Cipresso"
  latinName: string;      // es: "Cupressus sempervirens"
  description: string;    // breve testo
  height: {
    maturity: string;     // "6–12 m"
    sizeClass: string;    // "II°"
    crownSize: string;    // "Media (10–15 m)"
  };
  features: Feature[];    // elenco caratteristiche (icona + label + value)
  ecology?: string;       // testo opzionale
};

export default function TreeDetail({
  data,
}: {
  data: TreeData;
}) {
  const { commonName, latinName, description, height, features, ecology } = data;

  // suddivido le features in righe da 3 per mobile/tablet
  const chunk = <T,>(arr: T[], size: number) =>
    arr.reduce<T[][]>((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);

  const featureRows = chunk(features, 3);

  return (
    <Container className={styles.page}>
      <header className="text-center mb-3">
        <h2 className={styles.title}>{commonName}</h2>
        <p className={`${styles.subtitle} fst-italic`}>{latinName}</p>
      </header>

      <section className="mb-3">
        <p className={styles.sectionTitle}>Descrizione:</p>
        <p className={styles.bodyText}>{description}</p>
      </section>

      <section className="mb-3">
        <p className={styles.sectionTitle}>Altezza:</p>
        <Row className="g-3">
          <Col xs={12} sm={4}>
            <div className={styles.cardlet}>
              <div className={styles.iconCircle}>
                {/* icona/emoji es. altezza */}
                <span role="img" aria-label="maturity">🌳</span>
              </div>
              <div className={styles.cardText}>
                <p className={styles.cardLabel}>Altezza a maturità</p>
                <p className={styles.cardValue}>{height.maturity}</p>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={4}>
            <div className={styles.cardlet}>
              <div className={styles.iconCircle}><span role="img" aria-label="class">↕️</span></div>
              <div className={styles.cardText}>
                <p className={styles.cardLabel}>Classe di grandezza</p>
                <p className={styles.cardValue}>{height.sizeClass}</p>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={4}>
            <div className={styles.cardlet}>
              <div className={styles.iconCircle}><span role="img" aria-label="crown">🎋</span></div>
              <div className={styles.cardText}>
                <p className={styles.cardLabel}>Taglia chioma</p>
                <p className={styles.cardValue}>{height.crownSize}</p>
              </div>
            </div>
          </Col>
        </Row>
      </section>

      <section className="mb-3">
        <p className={styles.sectionTitle}>Caratteristiche:</p>

        {featureRows.map((row, idx) => (
          <Row className="g-3" key={idx}>
            {row.map((f, i) => (
              <Col xs={12} sm={4} key={i}>
                <div className={styles.cardlet}>
                  <div className={styles.iconCircle}>
                    {f.icon ? (
                      <Image
                        src={f.icon}
                        alt={f.label}
                        width={28}
                        height={28}
                        className={styles.iconImg}
                      />
                    ) : (
                      <span aria-hidden="true">{f.emoji ?? "❖"}</span>
                    )}
                  </div>
                  <div className={styles.cardText}>
                    <p className={styles.cardLabel}>{f.label}:</p>
                    <p className={styles.cardValue}>{f.value}</p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        ))}
      </section>

      <section>
        <p className={styles.sectionTitle}>Funzione ecologica:</p>
        <p className={styles.bodyText}>{ecology ?? "—"}</p>
      </section>
    </Container>
  );
}
