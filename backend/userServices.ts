import { db } from './firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, where, DocumentReference, QuerySnapshot, DocumentSnapshot,
   updateDoc, arrayUnion, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from "firebase/storage";

import { Comment, FormState, UserTreeDb, UserDb, ElemListTree } from "@service/types/interface_db";
import { UserTreeType } from "@service/types/interface_context.d";


/*----------------- CREDENZIALI UTENTE -----------------*/
export const checkUserCredentials = async (username: string, password: string): Promise<{ success: boolean, user?: UserDb, error?: string }> => {
  try {
    console.log('🔐 Verifica credenziali per:', username);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('__name__', '==', username));
    const querySnapshot: QuerySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Utente non trovato' };
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    if (userData.password === password) {
      const user: UserDb = { username: userDoc.id, password, email: userData.email || ''};
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true, user };
    } else {
      return { success: false, error: 'Password errata' };
    }
  } catch (error) {
    console.error('Errore verifica credenziali:', error);
    return { success: false, error: (error as Error).message }
  }
};

// ✅ Registra un nuovo utente in Firestore
export const registerUser = async (newUser: UserDb): Promise<{ success: boolean, user?: UserDb, error?: string }> => {
  const {username, password, email} = newUser
  try {
    console.log('📝 Registrazione nuovo utente:', username);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('__name__', '==', username));
    const querySnapshot: QuerySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { success: false, error: 'Username già esistente' };
    }

    const userRef = doc(collection(db, 'users'), username);
    await setDoc(userRef, { password, email });

    const user: UserDb = { username,password, email: email || '' };
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    return { success: true, user };
  } catch (error) {
    console.error('Errore registrazione:', error);
    return { success: false, error: (error as Error).message }
  }
};

// ✅ Restituisce l'utente attualmente loggato dal sessionStorage
export const getCurrentUser = (): UserDb | null => {
  try {
    const userData = sessionStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Errore recupero utente:', error);
    return null;
  }
};

// ✅ Esegue il logout dell'utente
export const logoutUser = (): { success: boolean } => {
  sessionStorage.removeItem('currentUser');
  return { success: true };
};

// ✅ Ottiene il profilo completo dell'utente (incluso user-tree e commenti)
/*export const getUserProfile = async (userId: string): Promise<{ success: boolean, data?: { user: User, userTree: UserTree | null }, error?: string }> => {
  try {
    const userRef = doc(collection(db, 'users'), userId);
    const userSnap: DocumentSnapshot = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { success: false, error: 'Utente non trovato' };
    }

    const userData = userSnap.data()!;
    const userTreeRef = doc(collection(db, 'user_trees'), userId);
    const userTreeSnap: DocumentSnapshot = await getDoc(userTreeRef);
    
    let userTreeData: UserTreeType | null = null;
    if (userTreeSnap.exists()) {
      userTreeData = userTreeSnap.data() as UserTreeType;
      if (userTreeData.comments && userTreeData.comments.length > 0) {
        const commentsSnapshot = await getDocs(collection(db, 'comments'));
        const commentsDetails = commentsSnapshot.docs
          .filter((doc) => userTreeData?.comments.includes(doc.id))
          .map((doc) => ({ id: doc.id, ...doc.data() }));
        
        userTreeData.commentsDetails = commentsDetails;
      }
    }

    const user: User = { id: userId, username: userId, email: userData.email || '' };
    return { success: true, data: { user, userTree: userTreeData } };
  } catch (error) {
    console.error('Errore recupero profilo:', error);
    return { success: false, error: (error as Error).message }
  }
};*/

// 🔹 Assicura che il documento dell'utente esista nella collezione user-tree
export const ensureUserTreeDoc = async (username: string): Promise<DocumentReference> => {
  const userDocRef = doc(db, 'user-tree', username);
  const userDocSnap: DocumentSnapshot = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    await setDoc(userDocRef, {});
    console.log('🆕 Creato documento user-tree per', username);
  }

  return userDocRef;
};

// 🔹 Aggiunge un nuovo albero visitato alla collezione dell'utente
export const addTreeToUser = async (username: string, userTree: Record<string, any>): Promise<void> => {
  if (!userTree) return;

  try {
    const userDocRef = await ensureUserTreeDoc(username);
    const safeTreeId = userTree['id scheda']?.replace(/\//g, '.') || `tree-${Date.now()}`;
    const treeDocRef = doc(collection(userDocRef, 'tree'), safeTreeId);
    const treeSnap: DocumentSnapshot = await getDoc(treeDocRef);

    if (!treeSnap.exists()) {
      const lat = userTree.lat || '';
      const lon = userTree.lon || '';
      const coordinates = `${lat},${lon}`;
      
      await setDoc(treeDocRef, {
        soprannome: userTree.soprannome || 'Senza nome',
        specie: userTree['specie nome scientifico'] || 'Specie sconosciuta',
        luogo: userTree.comune || 'Comune sconosciuto',
        regione: userTree.regione || 'Regione sconosciuta',
        coordinates,
        comments: [],
      });

      console.log('🌳 Nuovo albero aggiunto per', username, '→', safeTreeId);
    }
  } catch (error) {
    console.error('❌ Errore addTreeToUser:', error);
  }
};

// 🔹 Recupera tutti gli alberi visitati da un utente
export const getUserTrees = async (username: string ): Promise<ElemListTree[]> => { // Dichiariamo esplicitamente che ritorniamo Tree[]
  try {
    const userDocRef = doc(db, 'user-tree', username);
    const userDocSnap: DocumentSnapshot = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {});
      console.log('🆕 Creato nuovo documento user-tree per', username);
      return [] as ElemListTree[];
    }

    const treeCollectionRef = collection(userDocRef, 'tree');
    const querySnapshot: QuerySnapshot = await getDocs(treeCollectionRef);
    
    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Partial<UserTreeDb>;

      return {
        id: docSnap.id,
        soprannome: data.soprannome || 'Senza nome',
        specie: data.specie || 'Specie sconosciuta',
        luogo: data.luogo || 'Comune sconosciuto',
        regione: data.regione || 'Regione sconosciuta',
        coordinates: data.coordinates || '',
        comments: data.comments || [],
      } as ElemListTree;
    });
  } catch (error: unknown) {
    return [] as ElemListTree[];
  }
};


/**----------- STATO DI SALUTE --------------- */

// Funzione per pulire l'ID e renderlo valido per Firestore
export const getCleanTreeId = (userTree: { "id scheda": string | null }): string | null => {
  if (!userTree || !userTree["id scheda"]) return null;
  
  const rawId = userTree["id scheda"].toString();
  return rawId.replace(/\//g, '_').replace(/\./g, '_');
};

// Funzione per salvare o aggiornare lo stato di salute
export const saveHealthStatus = async (
  currentStatus: number | null,
  healthLevels: { level: number; label: string }[],
  userTree: { "id scheda": string | null },
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setHasSubmitted: React.Dispatch<React.SetStateAction<boolean>>,
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>,
  setIsSubmit: React.Dispatch<React.SetStateAction<boolean>>,
): Promise<void> => {
  if (!currentStatus || !userTree) {
    alert("Seleziona uno stato di salute prima di inviare");
    return;
  }

  setIsLoading(true);

  try {
    const cleanTreeId = getCleanTreeId(userTree);
    
    if (!cleanTreeId) {
      throw new Error("ID albero non valido");
    }

    const healthEntry = {
      livello: currentStatus,
      livelloLabel: healthLevels.find(h => h.level === currentStatus)?.label || "Sconosciuto",
      timestamp: new Date().toISOString(),
    };

    console.log("Tentativo di salvataggio per albero ID:", cleanTreeId);

    const treeDocRef = doc(db, "Salute", cleanTreeId);
    const treeDoc = await getDoc(treeDocRef);

    if (treeDoc.exists()) {
      await updateDoc(treeDocRef, {
        storico: arrayUnion(healthEntry),
      });
      console.log("Documento aggiornato");
    } else {
      await setDoc(treeDocRef, {
        alberoId: cleanTreeId,
        storico: [healthEntry],
      });
      console.log("Nuovo documento creato");
    }

    setHasSubmitted(true);
    setShowModal(false);
    setIsSubmit(true);
    alert(`Stato di salute salvato: Livello ${currentStatus}`);
  } catch (error) {
    console.error("Errore nel salvataggio: ", error);
    alert("Errore nel salvataggio dello stato di salute. Riprova.");
  } finally {
    setIsLoading(false);
  }
};

/*----------- CHAT E QUERY ---------------*/
export const saveChatToFirebase = async (userMessage: string, botMessage: string | null, userTreeName: string, variant: string) => {
    try {
        await addDoc(collection(db, "chat_queries"), {
            treeName: userTreeName || null,
            query: userMessage,
            version: variant,
        });
        console.log("✅ Query salvata su Firestore");
    } catch (error) {
        console.error("❌ Errore nel salvataggio su Firestore:", error);
    }
};



/*------------------ PAGINA COMMENTI ------------------*/

// Funzione per salvare un commento
export const saveCommentToFirebase = async (comment: Comment, userTree : UserTreeType) => {
  const text: string = comment.text;
  const author: string = comment?.author || '';
  const idTree: string = userTree['id scheda']

  try {

    // Salva il commento nella collezione "comments"
    await addDoc(collection(db, "comments"), {
      date: serverTimestamp(),
      id_tree: idTree,
      text: text.trim(),
      user: author,
    });
    console.log("✅ Commento aggiunto a Firestore (collezione comments)");

    // Aggiorna la struttura dell'albero utente se l'utente è loggato
    if (author) {
      const safeTreeId = idTree.replace(/\//g, ".");
      const userTreeDocRef = doc(db, "user-tree", author);

      const userDocSnap = await getDoc(userTreeDocRef);
      if (!userDocSnap.exists()) {
        await setDoc(userTreeDocRef, {});
        console.log("🆕 Creato nuovo documento per utente:", author);
      }

      const treeDocRef = doc(collection(userTreeDocRef, "tree"), safeTreeId);
      const treeDocSnap = await getDoc(treeDocRef);

      if (!treeDocSnap.exists()) {
        const lat = userTree.lat || "";
        const lon = userTree.lon || "";
        const coordinates = `${lat},${lon}`;

        await setDoc(treeDocRef, {
          soprannome: userTree.soprannome || "Senza nome",
          specie: userTree["specie nome scientifico"] || "Specie sconosciuta",
          luogo: userTree.comune || "Comune sconosciuto",
          regione: userTree.regione || "Regione sconosciuta",
          coordinates,
          comments: [],
        });
        console.log("🌳 Creato nuovo documento tree per", safeTreeId);
      }

      await updateDoc(treeDocRef, {
        comments: arrayUnion(text.trim()),
      });
      console.log("💬 Commento aggiunto anche in user-tree → tree → comments");
    }
  } catch (error) {
    console.error("❌ Errore nel salvataggio del commento:", error);
  }
};

// Funzione per caricare i commenti da Firestore
export const loadCommentsFromFirebase = async (userTree: UserTreeType) => {
  if (!userTree?.["id scheda"]) {
    console.warn("⚠️ Nessun id scheda disponibile per l'albero");
    return [];
  }

  try {
    const q = query(
      collection(db, "comments"),
      where("id_tree", "==", userTree?.["id scheda"]),
      orderBy("date", "asc")
    );

    const snapshot = await getDocs(q);

    const loadedEntries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        date: data.date?.toDate?.().toLocaleDateString("it-IT") || "—",
        text: data.text || "",
        author: data.user || undefined,
      };
    });

    console.log("✅ Commenti caricati da Firestore:", loadedEntries);
    return loadedEntries;
  } catch (error) {
    console.error("❌ Errore nel caricamento dei commenti:", error);
    return [];
  }
};


/*MODULO FORM NO TREE */

export const savePhotoToStorage = async (foto: File) => {
  const storage = getStorage();
  const storageRef = ref(storage, `trees_photos/${foto.name}`);

  try {
    const snapshot = await uploadBytes(storageRef, foto);
    console.log("Foto caricata con successo:", snapshot.ref);
    return snapshot.ref.fullPath; // Restituisce il percorso della foto
  } catch (error) {
    console.error("Errore nel caricamento della foto:", error);
    throw error;
  }
};

export const saveTreeData = async (form: FormState, foto: File | null) => {
  try {
    const treeData = {
      nome: form.nome,
      altezza: form.altezza,
      circonferenza: form.circonferenza,
      posizione: form.posizione,
      numeroEsemplari: form.numeroEsemplari,
      comune: form.comune,
      localita: form.localita,
      via: form.via,
      proprieta: form.proprieta,
      proprietario: form.proprietario,
      motivi: form.motivi,
      descrizione: form.descrizione,
      cognome: form.cognome,
      nomeSegnalante: form.nomeSegnalante,
      indirizzo: form.indirizzo,
      telefono: form.telefono,
      mail: form.mail,
      createdAt: new Date().toISOString(),
    };

    // Salva i dati del tree nel Firestore
    const docRef = await addDoc(collection(db, "new_tree"), treeData);
    console.log("Documento aggiunto con ID:", docRef.id);

    // Carica la foto su Firebase Storage (se presente)
    let photoUrl = null;
    if (foto) {
      photoUrl = await savePhotoToStorage(foto); // Carica la foto e ottieni l'URL
      // Aggiorna il documento Firestore con l'URL della foto (opzionale)
      await updateDoc(docRef, { photoUrl });
    }

    return docRef.id;
  } catch (error) {
    console.error("Errore nel salvataggio dell'albero:", error);
    throw error;
  }
};

