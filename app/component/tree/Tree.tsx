"use client"

import { Container, Row, Col, Button } from "react-bootstrap"
import { FaBookOpen, FaTree, FaCamera, FaInfoCircle } from "react-icons/fa"
import Image from "next/image"
import styles from "./Tree.module.css"
import Title from "@component/ui/Title"
import TimeLine from "@component/timeline/TimeLine"
import Link from "next/link"
import MapLink from "@component/maps/PositionMap"
import { useContext, useState, useEffect } from "react"
import { UserContext } from "@/app/layout"
import HealthStatus from "@component/ui/HealthStatus"
import { TreeProps } from "@service/types/interface_page"
import { UserTreeType } from "@/backend/types/interface_context"
import { useRouter } from "next/navigation"
import { sleep } from "@/backend/treeServices"

export default function Tree({ variant = "statico" }: TreeProps) {
  const userContext = useContext(UserContext) || ({} as { userTree?: UserTreeType })
  const { userTree } = userContext
  const [imageSrc, setImageSrc] = useState<string>("/tree/empty.png")
  const [imageLoaded, setImageLoaded] = useState<boolean>(false)
  const router = useRouter()

  // Precarica e verifica l'immagine
  useEffect(() => {
    const checkImageExists = async () => {
      const treeId = userTree?.["id scheda"]
      if (!treeId) {
        setImageSrc("/tree/tree-default.png")
        return
      }

      const potentialImageSrc = `/tree/${treeId.replaceAll("/", ".")}.png`

      try {
        const response = await fetch(potentialImageSrc, { method: "HEAD" })
        if (response.ok) {
          setImageSrc(potentialImageSrc)
        } else {
          setImageSrc("/tree/tree-default.png")
        }
      } catch {
        console.log("Immagine non trovata, uso default")
        setImageSrc("/tree/tree-default.png")
      }
      setImageLoaded(true)
    }

    if (userTree) {
      checkImageExists()
    }
  }, [userTree])

  const handlePhoto = () => {
    alert("📸 Funzionalità foto attivata!")
  }

  // Configurazione in base alla variante
  const getTreeConfig = () => {
    switch (variant) {
      case "scientifico":
        return {
          treeButtonText: "Parla con l'albero",
          treeButtonIcon: <FaTree />,
          treeButtonHref: `/pages/chatbot?variant=${variant}`,
          treeButtonClass: "green",
        }
      case "narrativo":
        return {
          treeButtonText: "Parla con l'albero",
          treeButtonIcon: <FaTree />,
          treeButtonHref: `/pages/chatbot?variant=${variant}`,
        }
      case "statico":
      default:
        return {
          treeButtonText: "Informazioni sull'albero",
          treeButtonIcon: <FaInfoCircle />,
          treeButtonHref: "/pages/infoTree",
        }
    }
  }

  const treeConfig = getTreeConfig()

  if (!userTree) return null

  // Determina la classe CSS in base al tipo di immagine
  const imageClass = imageSrc === "/tree/tree-default.png" ? styles.treeImgDef : styles.treeImg

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
        <p className="text-center my-1">
          {userTree["index_specie"] === "" ? (
            <span>{userTree["specie nome scientifico"]}</span>
          ) : (
            <Link href="/pages/specie" className={styles.nameLink}>
              {userTree["specie nome scientifico"]}
            </Link>
          )}
        </p>
      )}

      <p className="text-muted text-end fst-italic m-0 pt-1">
        {userTree["comune"]}, {userTree["provincia"]}, {userTree["regione"]}
      </p>

      <Row className="tw:min-h-96">
        {/* Immagine albero - MANTENUTO COME ORIGINALE */}
        <Col xs={4} className="m-0 p-0 text-center colInfo tw:relative">
          <Image
            src={imageSrc}
            alt={userTree["soprannome"] || userTree["specie nome volgare"]}
            width={300}
            height={400}
            className={`${imageClass} img-fluid tw:max-h-128 tw:absolute tw:bottom-0 tw:left-0 ${
              !imageLoaded ? styles.treeImgBlur : styles.treeImgLoaded
            }`}
            priority
          />
        </Col>

        {/* Info testo */}
        <Col xs={8} className={`${styles.treeInfo} m-0 align-middle`}>
          {/* Mappa link */}
          {userTree.lat && userTree.lon && (
            <MapLink
              lat={userTree.lat}
              lng={userTree.lon}
              label=">> Vedi posizione"
              className="tx-small text-end w-100 mt-0 mb-2"
            />
          )}

          <div>
            {/* Stato di salute attuale */}
            {userTree.stato_salute && (
              <div className="d-flex justify-content-between align-items-center mb-2">
                <p className="mt-2 fw-bold mb-0">Stato di salute {userTree.stato_salute}</p>
              </div>
            )}

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
            <ul className={styles.treeInfoCriteri}>
              {userTree["criteri di monumentalità"]
                ?.replace(/^-/, "")
                .split("-")
                .map((c: string, i: any) => (
                  <li key={i}>{c}</li>
                ))}
            </ul>

            {/* Età stimata */}
            {userTree["eta_descrizione"] && (
              <p className="mt-1">
                <strong>Stima età:</strong> {userTree["eta_descrizione"]}
              </p>
            )}
          </div>
        </Col>
      </Row>

      {/* Timeline - MOSTRATA SOLO SE È PRESENTE IL CAMPO "eta" */}
      {userTree["eta"] && <TimeLine eta={userTree["eta"]} endYear={new Date().getFullYear()} />}

      {/* Bottone di navigazione */}
      <div className="w-100 tw:flex tw:justify-between">
        <Button
          onClick={() => router.push("/pages/diary")}
          variant="primary"
          className="mt-3 mb-5 fw-bold d-flex align-items-center gap-2 flame"
        >
          <FaBookOpen /> Pezzi di storia
        </Button>
        {/* Bottone salute */}
        <HealthStatus />
        <Button
          onClick={async () => {
            await sleep(300)
            router.push(treeConfig.treeButtonHref)
          }}
          variant="primary"
          className={`mt-3 mb-5 fw-bold d-flex align-items-center gap-2 green`}
        >
          {treeConfig.treeButtonIcon} {treeConfig.treeButtonText}
        </Button>
      </div>

      {/* Bottone per fare foto in basso a sinistra */}
      {/*<div className={styles.photoWrapper}>
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
      </div>*/}
    </Container>
  )
}
