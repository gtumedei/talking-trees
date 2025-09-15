"use client";

import { Container, Row, Col, Button } from "react-bootstrap";
import { FaBookOpen, FaTree, FaCamera } from "react-icons/fa";
import Image from "next/image";
import styles from "./page.module.css";
import Title from "./Title";
import TimeLine from "./component/TimeLine";
import Link from "next/link";
import MapLink from "./component/PositionMap";

export default function Tree({ tree }: { tree: any }) {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 200;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      alert(`📸 Foto scattata: ${file.name}`);
      // qui puoi caricarla su server o salvarla in galleria
    }
  };

  return (
    <Container className={`${styles.page}`}>
      <Title
        text={tree.name}
        level={1}
        className="text-center mt-3 mb-0 display-6"
      />

      <p className="text-center">
        <Link href="/treedetail">{tree.species}</Link>
      </p>
      <p className="text-muted text-end fst-italic m-0">{tree.location}</p>

      <Row>
        {/* Immagine albero */}
        <Col xs={5} className="m-0 p-0 text-center align-middle">
          <Image
            src={tree.image}
            alt={tree.name}
            fill
            className={`${styles.treeImg} img-fluid`}
          />
        </Col>

        {/* Info testo */}
        <Col xs={7} className={`${styles.treeInfo} m-0 align-middle pe-2`}>
          <p className="fst-italic text-muted text-end tx-small m-0">
            In Emilia Romagna sono presenti  
            <strong>
              {" "}
              <a
                href="https://alberimonumentali.info/regioni/emilia-romagna"
                target="_blank"
              >
                126 alberi monumentali
              </a>
            </strong>, di cui <strong>1 vicino a te</strong>.
          </p>

          <MapLink
            lat={tree.lat}
            lng={tree.lng}
            label=">> Vedi posizione"
            className="tx-small text-end w-100 mt-0 mb-3"
          />

          <p className="mt-2 fw-bold">Dimensioni</p>
          <ul>
            <li>Circonferenza fusto: {tree.dimensions.circ}</li>
            <li>Altezza: {tree.dimensions.height}</li>
          </ul>

          <p className="mt-1 fw-bold">Criteri di Monumentalità</p>
          <ul>
            {tree.criteria.map((c: string, i: number) => (
              <li key={i}>{c}</li>
            ))}
          </ul>

          <p className="mt-1">
            <strong>Stima età:</strong> {tree.age}
          </p>
        </Col>
      </Row>

      <TimeLine startYear={startYear} endYear={currentYear} />

      <div className="w-100 d-flex justify-content-around">
        <Button
          as={Link}
          href="/diary"
          variant="secondary"
          className="mt-3 mb-5 fw-bold d-flex align-items-center gap-2"
        >
          <FaBookOpen />
          Pezzi di storia
        </Button>

        <Button
          as={Link}
          href="/chatbot"
          variant="secondary"
          className="mt-3 mb-5 fw-bold d-flex align-items-center gap-2"
        >
          <FaTree />
          Parla con l'albero
        </Button>
      </div>

      {/* Bottone fotocamera */}
      <Button
        variant="light"
        className={styles.photoButton}
        onClick={() => document.getElementById("cameraInput")?.click()}
      >
        <FaCamera size={20} />
      </Button>

      <input
        type="file"
        accept="image/*"
        capture="environment"   // apre direttamente la fotocamera posteriore su mobile
        id="cameraInput"
        style={{ display: "none" }}
        onChange={handlePhoto}
      />
    </Container>
  );
}
