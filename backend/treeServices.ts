// /app/services/treeService.ts

import { db } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { UserDb } from "./types/interface_db";
import { UserTreeType } from "./types/interface_context";

/**
 * Verifica se esiste un documento per l'utente nel percorso `user-tree/username`.
 * Se il documento non esiste, crea un nuovo documento vuoto per l'utente.
 * 
 * @param username - Il nome utente per il quale assicurarsi che esista un documento.
 * @returns Il riferimento al documento dell'utente.
 */
export async function ensureUserTreeDoc(username: string) {
  // Creazione del riferimento al documento dell'utente
  const userDocRef = doc(db, "user-tree", username);

  // Recupero del documento
  const userDocSnap = await getDoc(userDocRef);

  // Se il documento non esiste, creiamo un nuovo documento vuoto
  if (!userDocSnap.exists()) {
    // Crea il documento dell'utente
    await setDoc(userDocRef, {});
    console.log('🆕 Creato documento user-tree per', username);
    
    // Crea una raccolta "tree" vuota all'interno del documento dell'utente
    const treeCollectionRef = collection(userDocRef, 'tree');
    // Puoi anche aggiungere un documento vuoto, o definire una struttura per la raccolta
    await setDoc(doc(treeCollectionRef), {}); // aggiungi un documento vuoto alla raccolta "tree"
    console.log('🌳 Creata raccolta "tree" per', username);
  }

  // Restituisce il riferimento al documento utente
  return userDocRef;
}

/**
 * Aggiunge un nuovo albero al documento dell'utente.
 * Se il documento dell'utente non esiste, viene creato tramite `ensureUserTreeDoc`.
 * Crea un documento per l'albero nella collezione `tree` associata all'utente.
 * 
 * @param username - Il nome utente a cui associare l'albero.
 * @param userTree - L'oggetto contenente i dati dell'albero da aggiungere.
 */
export async function addTreeToUser(username: string, userTree: any) {
  // Se l'oggetto dell'albero è vuoto, interrompiamo l'esecuzione
  if (!userTree) return;

  // Verifica se esiste già il documento dell'utente e otteniamo il riferimento
  const userDocRef = await ensureUserTreeDoc(username);

  // Creazione di un ID sicuro per l'albero sostituendo "/" con "."
  const safeTreeId = userTree["id scheda"].replace(/\//g, ".");

  // Creazione del riferimento al documento dell'albero
  const treeDocRef = doc(collection(userDocRef, "tree"), safeTreeId);

  // Verifica se il documento dell'albero esiste
  const treeSnap = await getDoc(treeDocRef);

  // Se l'albero non esiste, lo creiamo
  if (!treeSnap.exists()) {
    // Estrazione delle coordinate
    const lat = userTree.lat || "";
    const lon = userTree.lon || "";
    const coordinates = `${lat},${lon}`;

    // Creazione del documento dell'albero con i dati forniti
    await setDoc(treeDocRef, {
      soprannome: userTree.soprannome || "Senza nome", // Soprannome dell'albero
      specie: userTree["specie nome scientifico"] || "Specie sconosciuta", // Nome scientifico della specie
      luogo: userTree.comune || "Comune sconosciuto", // Comune dove si trova l'albero
      regione: userTree.regione || "Regione sconosciuta", // Regione dove si trova l'albero
      coordinates, // Coordinate geografiche
      comments: [], // Lista dei commenti (vuota inizialmente)
    });

    // Log per indicare che l'albero è stato creato
    console.log("🌳 Creato nuovo documento tree:", safeTreeId);
  }
}

/**
 * Recupera tutti gli alberi associati a un utente.
 * Se il documento dell'utente non esiste, viene creato un documento vuoto.
 * 
 * @param username - Il nome utente per cui ottenere gli alberi.
 * @returns Un array di oggetti che rappresentano gli alberi dell'utente.
 */
/*export async function getUserTrees(username: string) {
  // Creazione del riferimento al documento dell'utente
  const userDocRef = doc(db, "user-tree", username);

  // Recupero del documento dell'utente
  const userDocSnap = await getDoc(userDocRef);

  // Se il documento non esiste, creiamo un nuovo documento vuoto
  if (!userDocSnap.exists()) {
    await setDoc(userDocRef, {}); // Crea un documento vuoto
    console.log("🆕 Creato nuovo documento per utente:", username);
    return []; // Se non ci sono alberi, restituisce un array vuoto
  }

  // Recupero della collezione di alberi dell'utente
  const treeCollectionRef = collection(userDocRef, "tree");

  // Recupero dei documenti degli alberi
  const querySnapshot = await getDocs(treeCollectionRef);

  // Restituisce un array con i dati degli alberi dell'utente
  return querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id, // ID dell'albero
    ...docSnap.data(), // Dati dell'albero
  }));
}*/


/**------ VALIDATION ------- */
export const isValidUser = (user: UserDb | null | undefined) => {
  return user && Object.keys(user).length > 0;
};

export const isValidTree = (tree: UserTreeType | null | undefined) => {
  return tree && Object.keys(tree).length > 0;
};