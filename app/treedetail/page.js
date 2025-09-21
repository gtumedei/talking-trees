"use client";

import { useContext } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";
import styles from "./TreeDetail.module.css";
import { UserContext } from "../layout";
import Title from "../Title";

export default function TreeDetail() {
  const { userSpecies } = useContext(UserContext);
  if (!userSpecies) return null;

  console.log("🌳 Specie selezionata:", userSpecies);

  return (
    <Container className={styles.page}>
      <section className="mb-4">
        <Title
          text={userSpecies.nome_comune}
          level={1}
          className="text-center mt-3 mb-2 mb-0 display-6"
        />
        <p className={`fst-italic text-center mb-0`}>
          <strong>Specie:</strong>{userSpecies.nome_specie}
        </p>
        <p className={`fst-italic text-center mb-0`}>
         <strong>Genere:</strong> {userSpecies.nome_genere}
        </p>
        <p className={`fst-italic text-center mb-3`}>
          <strong>Famiglia:</strong> {userSpecies.nome_famiglia}
        </p>
        {userSpecies.descrizione && (
          <p className="text-center">{userSpecies.descrizione}</p>
        )}
      </section>

            {/* --- DIMENSIONI --- */}
      <section className="mb-4">
        <p className={styles.sectionTitle}>Dimensioni</p>
        <Row className="g-3">
          {(userSpecies.size_altezza ||
            userSpecies.size_altezza_max ||
            userSpecies.size_classe) && (
            <Col xs={6}>
              <div className={styles.card}>
                <Image src="/icon/altezza.png" alt="" width={40} height={40} />
                <p className="fw-bold">Altezza</p>
                {userSpecies.size_altezza && (
                  <p>A maturità: {userSpecies.size_altezza}</p>
                )}
                {userSpecies.size_altezza_max && (
                  <p>Massima: {userSpecies.size_altezza_max}</p>
                )}
                {userSpecies.size_classe && (
                  <p>Classe di grandezza: {userSpecies.size_classe}</p>
                )}
              </div>
            </Col>
          )}

          {userSpecies.size_chioma && (
            <Col xs={6}>
              <div className={styles.card}>
                <Image src="/icon/larghezza.png" alt="" width={40} height={40} />
                <p className="fw-bold">Taglia chioma</p>
                <p>{userSpecies.size_chioma}</p>
              </div>
            </Col>
          )}
        </Row>
      </section>

      {/* --- CARATTERISTICHE --- */}
      <section className="mb-4">
        <p className={styles.sectionTitle}>Caratteristiche</p>
        <Row className="g-3">
          {userSpecies.info_tipologia && (
            <Col xs={6}>
              <div className={styles.card}>
                <Image
                  src={`/icon/${userSpecies.info_tipologia
                    .toLowerCase()
                    .replace(/ /g, "_")}.png`}
                  alt=""
                  width={40}
                  height={40}
                />
                <p className="fw-bold">Tipologia</p>
                <p>{userSpecies.info_tipologia}</p>
              </div>
            </Col>
          )}

          {userSpecies.info_densita_chioma && (
            <Col xs={6}>
              <div className={styles.card}>
                <Image
                  src={`/icon/densità_${userSpecies.info_densita_chioma
                    .toLowerCase()
                    .replace(/ /g, "_")}.png`}
                  alt=""
                  width={40}
                  height={40}
                />
                <p className="fw-bold">Densità chioma</p>
                <p>{userSpecies.info_densita_chioma}</p>
              </div>
            </Col>
          )}

          {userSpecies.forma_chioma && (
            <Col xs={6}>
              <div className={styles.card}>
                <Image
                  src={`/icon/forma_${userSpecies.forma_chioma.toLowerCase().replace(/ /g, "_")}.png`}
                  alt=""
                  width={40}
                  height={40}
                />
                <p className="fw-bold">Forma chioma</p>
                <p>{userSpecies.info_forma_chioma}</p>
              </div>
            </Col>
          )}

          {userSpecies.portamento && (
            <Col xs={6}>
              <div className={styles.card}>
                <Image
                  src={`/icon/portamento_${userSpecies.portamento.toLowerCase()}.png`}
                  alt=""
                  width={40}
                  height={40}
                />
                <p className="fw-bold">Portamento</p>
                <p>{userSpecies.info_portamento}</p>
              </div>
            </Col>
          )}

          {(userSpecies.epoca_di_fioritura ||
            userSpecies.info_fioritura) && (
            <Col xs={6}>
              <div className={styles.card}>
                <Image
                  src={`/icon/fioritura_${userSpecies.epoca_di_fioritura.toLowerCase() || "default"}.png`}
                  alt=""
                  width={40}
                  height={40}
                />
                <p className="fw-bold">Fioritura</p>
                {userSpecies.info_stagione_fioritura && (
                  <p>Periodo: {userSpecies.epoca_di_fioritura}</p>
                )}
                {userSpecies.info_fioritura && (
                  <p className="fst-italic text-muted">
                    {userSpecies.info_fioritura}
                  </p>
                )}
              </div>
            </Col>
          )}

          {userSpecies.info_frutti && (
            <Col xs={6}>
              <div className={styles.card}>
                <Image src="/icon/frutti.png" alt="" width={40} height={40} />
                <p className="fw-bold">Frutti</p>
                <p>{userSpecies.info_frutti}</p>
              </div>
            </Col>
          )}

          {userSpecies.info_colori_autunnali && (
            <Col xs={6}>
              <div className={styles.card}>
                <Image
                  src="/icon/colore_foglie_autunnali.png"
                  alt=""
                  width={40}
                  height={40}
                />
                <p className="fw-bold">Colore foglie autunnali</p>
                <p>{userSpecies.info_colori_autunnali}</p>
              </div>
            </Col>
          )}
        </Row>
      </section>

      {/* --- AMBIENTE DI PROVENIENZA --- */}
      {userSpecies.habitat && (
        <section className="mb-4">
          <p className={styles.sectionTitle}>Ambiente di provenienza</p>
          <div className={`g-3 ${styles.card}`}>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              {[
                { key: "habitat_litorale", label: "Litorale" },
                { key: "habitat_pianura", label: "Pianura" },
                { key: "habitat_collina", label: "Collina" },
                { key: "habitat_montagna", label: "Montagna" },
                { key: "habitat_alloctona_esotica", label: "Alloctona/Esotica" },
              ]
                .filter((h) => userSpecies[h.key] === "Sì")
                .map((h) => (
                  <Image
                    key={h.key}  // 👈 qui la key unica
                    src={`/icon/${h.key}.png`}
                    alt={h.label}
                    width={40}
                    height={40}
                    className="px-1 py-1"
                  />
                ))}
            </div>
            <p className="fw-bold text-center">{userSpecies.habitat}</p>
          </div>
        </section>
      )}

    </Container>
  );
}