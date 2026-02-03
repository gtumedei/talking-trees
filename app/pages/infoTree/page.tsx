"use client"

import Title from "@/app/component/ui/Title"
import { UserContext } from "@/app/layout"
import { Collapsible } from "@ark-ui/react"
import BackButton from "@component/ui/BackButton"
import {
  EcologicalData,
  HealthData,
  HistoricalData,
  LocationData,
  SpeciesData,
  TreeData,
} from "@service/types/interface_page"
import { FC, ReactNode, useContext } from "react"
import { Col, Container, Row } from "react-bootstrap"
import {
  FaAlignLeft,
  FaChevronDown,
  FaHeart,
  FaHistory,
  FaInfoCircle,
  FaLeaf,
  FaMapMarkerAlt,
  FaRecycle,
} from "react-icons/fa"
import styles from "./InfoTree.module.css"

// Define types for the data structure (adjust these as per your actual data structure)
interface Document {
  name: string
  sections?: {
    id: string
    content: any
  }[]
}

interface UserContextType {
  document: Document | null
}

export default function InfoTree() {
  // Define the context type
  const { document } = useContext(UserContext) as UserContextType

  if (!document) {
    return (
      <Container className="text-center mt-5">
        <h2>Dati non disponibili</h2>
        <p>Impossibile caricare le informazioni dell'albero.</p>
      </Container>
    )
  }

  // Estrae i contenuti delle varie sezioni
  const getSection = (id: string) => document.sections?.find((s) => s.id === id)?.content || {}

  const albero = getSection("tree_data") as TreeData
  const descrizione = document.sections?.find((s) => s.id === "tree_description")?.content || ""
  const specie = getSection("species_data") as SpeciesData
  const ecologia = getSection("ecological_data") as EcologicalData
  const luogo = getSection("place_data") as LocationData
  const salute = getSection("health_data") as HealthData
  const storia = getSection("historical_data") as HistoricalData

  // Dati formattati
  const criteri = albero?.criteri || "N/D"
  const circonferenza = albero?.circonferenza ? albero.circonferenza : "N/D"
  const altezza = albero?.altezza ? albero.altezza : "N/D"

  const chioma =
    specie?.chioma?.forma || specie?.chioma?.densità
      ? `${specie.chioma.forma || ""} (${specie.chioma.densità || ""})`
      : "N/D"

  const dimensioniSpecie = specie?.dimensioni_specie
    ? `(Altezza: ${specie.dimensioni_specie.altezza_m}, Chioma: ${specie.dimensioni_specie.chioma})`
    : "N/D"

  const ecologicalEntries = Object.entries(ecologia || {}).filter(([_, v]) => v)
  const eventiStorici = storia?.eventi?.length ? storia.eventi : []

  // --- Info inquinanti ---
  const pollutantInfo: { [key: string]: { emoji: string; descrizione: string } } = {
    "CO₂": {
      emoji: "🌱",
      descrizione: "Riduce la concentrazione di anidride carbonica (gas serra).",
    },
    PM10: { emoji: "💨", descrizione: "Filtra le polveri sottili sospese nell’aria." },
    "O₃": { emoji: "☀️", descrizione: "Contribuisce a ridurre l’ozono troposferico." },
    "NO₂": {
      emoji: "🌫️",
      descrizione: "Assorbe biossido di azoto, migliorando la qualità dell’aria.",
    },
    "SO₂": {
      emoji: "🏭",
      descrizione: "Contrasta il biossido di zolfo derivante dalle attività industriali.",
    },
  }

  return (
    <Container className={styles.page}>
      <BackButton />
      <Title text="Info aggiuntive sul" level={1} className="text-center m-0" />
      <Title text={document.name} level={2} className="text-center mb-3" />

      <Row className="g-3">
        <Col xs={12}>
          <SectionCard
            icon={<FaInfoCircle />}
            title="Informazioni Tecniche"
            headerBgClass="tw:bg-(--dark-green)"
          >
            <p className="tw:mb-3!">
              <strong>Altezza:</strong> {altezza}
            </p>
            <p className="tw:mb-3!">
              <strong>Circonferenza:</strong> {circonferenza}
            </p>
            <p className="tw:mb-0!">
              <strong>Criteri di monumentalità:</strong> {criteri}
            </p>
          </SectionCard>
        </Col>

        <Col xs={12}>
          <SectionCard icon={<FaLeaf />} title="Specie Botanica" headerBgClass="tw:bg-(--green)">
            <p className="tw:mb-3!">
              <strong>Specie:</strong> {specie.nome_comune} - (<i>{specie.nome_scientifico}</i>)
            </p>
            <p className="tw:mb-3!">
              <strong>Caratteristiche specie:</strong> portamento {specie.portamento},{" "}
              {specie.tipologia}, Chioma: {chioma}
            </p>
            <p className="tw:mb-3!">
              <strong>Colori autunnali:</strong> {specie.colori_autunnali}
            </p>
            <p className="tw:mb-3!">
              <strong>Frutti:</strong> {specie.frutti}
            </p>
            <p className="tw:mb-3!">
              <strong>Fioritura:</strong> {specie.fioritura}
            </p>
            <p className="tw:mb-3!">
              <strong>Habitat specie:</strong> {specie.habitat}
            </p>
            <p className="tw:mb-0!">
              <strong>Dimensioni (specie):</strong> {dimensioniSpecie}
            </p>
          </SectionCard>
        </Col>

        <Col xs={12}>
          <SectionCard icon={<FaMapMarkerAlt />} title="Luogo" headerBgClass="tw:bg-(--myrtle)">
            <p className="tw:mb-3!">
              <strong>Luogo:</strong> (comune: {luogo.comune}), (Provincia: {luogo.provincia}),
              (Regione: {luogo.regione})
              {luogo.popolazione && luogo.superficie_km2 && (
                <>
                  {" "}
                  (Popolazione: {luogo.popolazione} abitanti, Superficie: {luogo.superficie_km2}{" "}
                  km²)
                </>
              )}
            </p>
            <p className="tw:mb-3!">
              <strong>Descrizione luogo territorio:</strong> {luogo.descrizione}
            </p>
            <p className="tw:mb-3!">
              <strong>Contesto storico luogo:</strong> {luogo.contesto_storico}
            </p>
            <p className="tw:mb-0!">
              <strong>Contesto culturale luogo:</strong> {luogo.contesto_culturale}
            </p>
          </SectionCard>
        </Col>

        {ecologicalEntries.length > 0 && (
          <Col xs={12}>
            <SectionCard
              icon={<FaRecycle />}
              title="Impatto Ecologico"
              headerBgClass="tw:bg-(--light-green)"
            >
              {ecologicalEntries.map(([key, value]) => {
                const base = key.replace("Abbattimento ", "")
                const info = pollutantInfo[base] ?? { emoji: "🌿", descrizione: "" }
                return (
                  <div key={key} className="mb-2">
                    <strong>
                      {info.emoji} Abbattimento {key}:
                    </strong>{" "}
                    {value.valore.replace("Abbattimento ", "").replace(key, "")}
                    {value.descrizione?.descrizione && (
                      <div className="small text-secondary text-center">
                        {value.descrizione.descrizione}
                      </div>
                    )}
                  </div>
                )
              })}
            </SectionCard>
          </Col>
        )}

        <Col xs={12}>
          <SectionCard icon={<FaHeart />} title="Salute" headerBgClass="tw:bg-(--flame)">
            <p className="tw:mb-3!">
              <strong>Stato:</strong> {salute.stato || "Non specificato"}
            </p>
            <p className="tw:mb-0!">
              <strong>Condizioni meteorologiche:</strong> {salute.condizioni_meteo || "N/D"}
            </p>
          </SectionCard>
        </Col>

        <Col xs={12}>
          <SectionCard icon={<FaHistory />} title="Storia ed Eventi" headerBgClass="tw:bg-(--noir)">
            <p className="tw:mb-0!">
              <strong>Età stimata:</strong> {storia.eta}
            </p>
          </SectionCard>
        </Col>

        <Col xs={12}>
          <SectionCard
            icon={<FaAlignLeft />}
            title="Descrizione"
            headerBgClass="tw:bg-(--light-noir)"
          >
            {descrizione}
          </SectionCard>
        </Col>
      </Row>
    </Container>
  )
}

const SectionCard: FC<{
  icon?: ReactNode
  title: string
  headerBgClass: string
  children?: ReactNode
}> = ({ icon, title, headerBgClass, children }) => {
  return (
    <Collapsible.Root className="tw:bg-white tw:rounded-md tw:shadow-lg tw:overflow-hidden">
      <Collapsible.Trigger asChild>
        <div
          className={`tw:w-full tw:flex tw:items-center tw:gap-2 tw:px-4 tw:py-2 tw:rounded-t-lg tw:text-(--light) ${headerBgClass}`}
        >
          {icon}
          <strong className="tw:grow">{title}</strong>
          <Collapsible.Indicator className="tw:-rotate-90 tw:data-[state=open]:rotate-0 tw:transition-transform">
            <FaChevronDown />
          </Collapsible.Indicator>
        </div>
      </Collapsible.Trigger>
      <Collapsible.Content className="tw:overflow-hidden tw:data-[state=open]:animate-slide-down tw:data-[state=closed]:animate-slide-up">
        <div className="tw:p-4">{children}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
