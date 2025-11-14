// backend/types/interface_db.ts

//chatbot
export interface Source {
  title: string;
  uri: string;
  content: string;
}

//commenti-ricordi
export type Comment = {
  date: string;
  text: string;
  author?: string | undefined;
};

// Tipizzazione del form NoTree
export interface FormState {
  nome: string;
  altezza: string;
  circonferenza: string;
  posizione: string;
  numeroEsemplari: string;
  comune: string;
  localita: string;
  via: string;
  proprieta: string;
  proprietario: string;
  motivi: string[];
  descrizione: string;
  cognome: string;
  nomeSegnalante: string;
  indirizzo: string;
  telefono: string;
  mail: string;
}

// Contenuto di User-Tree nel database
export interface UserTreeDb {
  soprannome: string;
  specie: string;
  luogo: string | null;
  regione: string;
  coordinates?: string; // coordinate sono opzionali
  comments?: string[]; // I commenti sono opzionali
}

export interface ElemListTree extends UserTreeDb{
  id: string;
}

// Contennuto utente db
export interface UserDb {
  username: string;
  password: string;
  email?: string;
}
