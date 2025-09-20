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
  if (!userTree) return null;

  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 200;

  const handlePhoto = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      alert(`📸 Foto scattata: ${file.name}`);
      // qui puoi caricarla su server o salvarla in galleria
    }
  };

  return (
    <Container className={`${styles.page}`}>
      <Title text={userTree.name} level={1} className="text-center mt-3 mb-0 display-6" />
      <p className="text-center">
        <Link href="/treedetail">{userTree.species}</Link>
      </p>
      <p className="text-muted text-end fst-italic m-0">{userTree.location}</p>

      <Row>
        <Col xs={5} className="m-0 p-0 text-center align-middle">
          <Image
            src={userTree.image}
            alt={userTree.name}
            fill
            className={`${styles.treeImg} img-fluid`}
          />
        </Col>

        <Col xs={7} className={`${styles.treeInfo} m-0 align-middle pe-2`}>
          <p className="fst-italic text-muted text-end tx-small m-0">
            In Emilia Romagna sono presenti  
            <strong>
              <a href="https://alberimonumentali.info/regioni/emilia-romagna" target="_blank">
                126 alberi monumentali
              </a>
            </strong>, di cui <strong>1 vicino a te</strong>.
          </p>

          <MapLink
            lat={userTree.lat}
            lng={userTree.lng}
            label=">> Vedi posizione"
            className="tx-small text-end w-100 mt-0 mb-3"
          />

          <p className="mt-2 fw-bold">Dimensioni</p>
          <ul>
            <li>Circonferenza fusto: {userTree.dimensions.circ}</li>
            <li>Altezza: {userTree.dimensions.height}</li>
          </ul>

          <p className="mt-1 fw-bold">Criteri di Monumentalità</p>
          <ul>
            {userTree.criteria.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>

          <p className="mt-1">
            <strong>Stima età:</strong> {userTree.age}
          </p>
        </Col>
      </Row>

      <TimeLine startYear={startYear} endYear={currentYear} />

      <div className="w-100 d-flex justify-content-around">
        <Button as={Link} href="/diary" variant="secondary" className="mt-3 mb-5 fw-bold d-flex align-items-center gap-2">
          <FaBookOpen /> Pezzi di storia
        </Button>
        <Button as={Link} href="/chatbot" variant="secondary" className="mt-3 mb-5 fw-bold d-flex align-items-center gap-2">
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
