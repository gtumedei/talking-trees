import {UserDb} from './interface_db'

// Definisci l'interfaccia per il contesto
interface UserContextType {
  userTree: UserTreeType;
  setUserTree: (tree: UserTreeType) => void;
  userSpecies: UserSpeciesType;
  setUserSpecies: (species: UserSpeciesType) => void;
  user: UserDb;
  setUser: (user: UserDb) => void;
  userCoords: any;
  setUserCoords: (coords: any) => void;
  authLoading: boolean;
  history: EventType[];
  setHistory: (events: EventType[]) => void;
  document: TreeStructure | null; // Ora è una struttura RAG
  setDocument: (doc: TreeStructure | null) => void;
  idSpacevector: string;
  setIdSpacevector:(id: string)=> void;
  mainroute: string;  // Aggiunto tipo per mainroute
}


// Definizione UserTree di UserContextontext
interface UserTreeType {
  progr: string;
  regione: string;
  'id scheda': string;
  provincia: string;
  comune: string;
  "altezza (m)": string;
  altezza_clear: string;
  "altitudine (m s.l.m.)": string;
  altitudine_clear: string;
  "circonferenza fusto (cm)": string;
  circonferenza_clear: string;
  contesto_urbano: string;
  "criteri di monumentalità": string;
  desc: string;
  eta: string;
  eta_descrizione: string;
  geometry: string;
  index_specie: string;
  lat: number;
  latitudine_su_gis: string;
  localita: string;
  lon: number;
  longitudine_su_gis: string;
  place: string;
  "proposta dichiarazione notevole interesse pubblico": string;
  soprannome: string;
  'specie nome scientifico': string;
  'specie nome volgare': string;
  stato_salute: string;
}

// Definizione Eventi di History di UserContextontext
type EventType = {
  year: number;
  text: string;
  category: string;
};

interface UserSpeciesType {
  nome_comune: string;
  nome_specie: string;
  nome_genere: string;
  nome_famiglia: string;
  descrizione?: string;
  size_altezza?: string;
  size_altezza_max?: string;
  size_classe?: string;
  size_chioma?: string;
  info_tipologia?: string;
  info_densita_chioma?: string;
  info_forma_chioma?: string;
  info_portamento?: string;
  epoca_di_fioritura?: string;
  info_fioritura?: string;
  info_stagione_fioritura?: string;
  info_frutti?: string;
  info_colori_autunnali?: string;
  info_abbattimento_co2?: string;
  info_abbattimento_no2?: string;
  info_abbattimento_o3?: string;
  info_abbattimento_pm10?: string;
  info_abbattimento_so2?: string;
  habitat?: string;
  habitat_litorale?: string;
  habitat_pianura?: string;
  habitat_collina?: string;
  habitat_montagna?: string;
  habitat_alloctona_esotica?: string;
}