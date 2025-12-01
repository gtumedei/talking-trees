"use client";

import { useContext } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";
import styles from "./Specie.module.css";
import { UserContext } from "@/app/layout";
import Title from "@component/ui/Title";
import BackButton from "@component/ui/BackButton";

import {UserSpeciesType, UserContextType} from "@service/types/interface_context"

export default function Specie() {
  const { userSpecies } = useContext(UserContext) as UserContextType;

  const HABITAT_KEYS : Array<keyof UserSpeciesType> = [ "habitat_litorale", "habitat_pianura",
    "habitat_collina", "habitat_montagna", "habitat_alloctona/esotica",];


  if (!userSpecies){
    console.error("Specie: userSpecies è null");
    return null;
  } else{
    console.log("Specie: userSpecies =", userSpecies);
  }

  return (
    <Container className={styles.page}>
      <BackButton />
      <section className="mb-4">
        <Title
          text={userSpecies.nome_comune}
          level={1}
          className="text-center mt-3 mb-2 mb-0 display-6"
        />
        <p className={`fst-italic text-center mb-0`}>
          <strong>Specie:</strong> {userSpecies.nome_specie}
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
                  <p>
                     <span>A maturità:{userSpecies.size_altezza}</span>
                  </p>
                )}

                {userSpecies.size_altezza_max && (
                  <p>
                     <span>Massima: {userSpecies.size_altezza_max}</span>
                  </p>
                )}

                {userSpecies.size_classe && (
                  <p>
                     <span>Classe di grandezza: {userSpecies.size_classe}</span>
                  </p>
                )}
              </div>
            </Col>
          )}

          {userSpecies.size_chioma && (
            <Col xs={6}>
              <div className={styles.card}>
                <Image src="/icon/larghezza.png" alt="" width={40} height={40} />
                <p className="fw-bold">Taglia chioma</p>
                <p><span>{userSpecies.size_chioma}</span></p>
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
                <p><span>{userSpecies.info_tipologia}</span></p>
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
                <p><span>{userSpecies.info_densita_chioma}</span></p>
              </div>
            </Col>
          )}

          {userSpecies.info_forma_chioma && (
            <Col xs={6}>
              <div className={styles.card}>
                <Image
                  src={`/icon/forma_${userSpecies.info_forma_chioma
                    .toLowerCase()
                    .replace(/ /g, "_")}.png`}
                  alt=""
                  width={40}
                  height={40}
                />
                <p className="fw-bold">Forma chioma</p>
                <p><span>{userSpecies.info_forma_chioma}</span></p>
              </div>
            </Col>
          )}

          {userSpecies.info_portamento && (
            <Col xs={6}>
              <div className={styles.card}>
                <Image
                  src={`/icon/portamento_${userSpecies.info_portamento.toLowerCase()}.png`}
                  alt=""
                  width={40}
                  height={40}
                />
                <p className="fw-bold">Portamento</p>
                <p><span>{userSpecies.info_portamento}</span></p>
              </div>
            </Col>
          )}

          {(userSpecies.epoca_di_fioritura || userSpecies.info_fioritura) && (
            <Col xs={6}>
              <div className={styles.card}>
                <Image
                  src={`/icon/fioritura_${userSpecies.epoca_di_fioritura?.toLowerCase() || "default"}.png`}
                  alt=""
                  width={40}
                  height={40}
                />
                <p className="fw-bold">Fioritura</p>

                {userSpecies.info_stagione_fioritura && (
                  <p>Periodo: <span>{userSpecies.info_stagione_fioritura}</span></p>
                )}

                {userSpecies.info_fioritura && (
                  <p className="fst-italic text-muted">
                    <span>{userSpecies.info_fioritura}</span>
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
                <p><span>{userSpecies.info_frutti}</span></p>
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
                <p><span>{userSpecies.info_colori_autunnali}</span></p>
              </div>
            </Col>
          )}

        </Row>
      </section>


      {/* --- IMPATTO AMBIENTALE --- */}
      {(userSpecies.info_abbattimento_co2 || userSpecies.info_abbattimento_pm10) && (
        <section className="mb-4">
          <p className={styles.sectionTitle}>Impatto Ambientale</p>
          <Row className="g-3">

            {userSpecies.info_abbattimento_co2 && (
              <Col xs={6}>
                <div className={styles.card}>
                  <Image
                    src={`/icon/${userSpecies.abbattimento_co2.toLowerCase()}.png`}
                    alt="CO2"
                    width={40}
                    height={40}
                  />
                  <p className="fw-bold">Assorbimento CO₂</p>
                  <p><span>{userSpecies.info_abbattimento_co2}</span></p>
                </div>
              </Col>
            )}

            {userSpecies.info_abbattimento_pm10 && (
              <Col xs={6}>
                <div className={styles.card}>
                  <Image
                    src={`/icon/${userSpecies.abbattimento_pm10.toLowerCase()}.png`}
                    alt="PM10"
                    width={40}
                    height={40}
                  />
                  <p className="fw-bold">Rimozione PM10</p>
                  <p><span>{userSpecies.info_abbattimento_pm10}</span></p>
                </div>
              </Col>
            )}

          </Row>
        </section>
      )}

      {/* --- AMBIENTE DI PROVENIENZA --- */}
      {userSpecies.habitat && (
        <section className="mb-4">
          <p className={styles.sectionTitle}>Ambiente di provenienza</p>

          <div className={`g-3 ${styles.card}`}>
            <div className="d-flex justify-content-center gap-3 flex-wrap">

              {HABITAT_KEYS
                .filter((key) => (userSpecies[key] === "Sì" || userSpecies[key] == ""))
                .map((key) => (
                  <Image
                    key={key}
                    src={`/icon/${String(key).toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`}
                    alt={key}
                    width={40}
                    height={40}
                  />
                ))}

            </div>

            <p className="fw-bold text-center">
              <span>{userSpecies.habitat}</span>
            </p>
          </div>
        </section>
      )}

    </Container>
  );
}
