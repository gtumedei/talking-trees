// Tipizzazione del tipo di applicazione
export interface TreeProps {
  variant?: "statico" | "scientifico" | "narrativo";
}

/*------------------ INFO TREE/BUILD STRUCTURE ------------------ */
type CSVRow = Record<string, string>;

interface EcologicalData {
  [key: string]: {
    valore: string;
    descrizione?: {
      descrizione: string;
    };
  };
}

interface SpeciesData {
  nome_comune: string;
  nome_scientifico: string;
  portamento: string;
  tipologia: string;
  chioma: {
    forma: string;
    densità: string;
  };
  colori_autunnali: string;
  frutti: string;
  fioritura: string;
  habitat: string;
  dimensioni_specie: {
    altezza_m: string;
    chioma: string;
  };
}

interface LocationData {
  comune: string;
  provincia: string;
  regione: string;
  popolazione?: string;
  superficie_km2?: string;
  descrizione: string;
  contesto_storico: string;
  contesto_culturale: string;
}

interface HealthData {
  stato: string;
  condizioni_meteo?: string;
}

interface HistoricalData {
  eta: string;
  eventi?: string[];
}

interface TreeData {
  criteri: string;
  circonferenza: string;
  altezza: string;
}
