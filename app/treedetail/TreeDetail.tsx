// components/TreeDetail.tsx
"use client";

import Image from "next/image";
import { Container, Row, Col } from "react-bootstrap";
import styles from "./TreeDetail.module.css";

export type Feature = { icon?: string; emoji?: string; label: string; value: string; };

export type TreeData = {
  commonName: string;
  latinName: string;
  description: string;
  height: { maturity: string; sizeClass: string; crownSize: string; };
  features: Feature[];
  ecology?: string;
};

export default function TreeDetail({ data }: { data: TreeData }) {
  const { commonName, latinName, description, height, features, ecology } = data;
  const chunk = <T,>(arr: T[], size: number) =>
    arr.reduce<T[][]>((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
  const featureRows = chunk(features, 3);

  return (
    <Container className={styles.page}>
      {/* ... IL TUO JSX (usa esattamente quello che hai postato) ... */}
      <header className="text-center mb-3">
        <h2 className={styles.title}>{commonName}</h2>
        <p className={`${styles.subtitle} fst-italic`}>{latinName}</p>
      </header>

      <section className="mb-3">
        <p className={styles.sectionTitle}>Descrizione:</p>
        <p className={styles.bodyText}>{description}</p>
      </section>

      {/* resto del component... */}
    </Container>
  );
}
