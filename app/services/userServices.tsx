import { db } from './firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, where, DocumentReference, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';

// Type definitions for user and user tree
interface User {
  id: string;
  username: string;
  email: string;
}

interface UserTree {
  soprannome: string;
  specie: string;
  luogo: string;
  regione: string;
  coordinates: string;
  comments: string[];
}

interface Comment {
  id: string;
  [key: string]: any; // You can replace this with more specific properties if you know the shape of comments
}

// ✅ Verifica le credenziali di login dell'utente
export const checkUserCredentials = async (username: string, password: string): Promise<{ success: boolean, user?: User, error?: string }> => {
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
      const user: User = { id: userDoc.id, username: userDoc.id, email: userData.email || '' };
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
export const registerUser = async (username: string, password: string, email: string | null = null): Promise<{ success: boolean, user?: User, error?: string }> => {
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

    const user: User = { id: username, username, email: email || '' };
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    return { success: true, user };
  } catch (error) {
    console.error('Errore registrazione:', error);
    return { success: false, error: (error as Error).message }
  }
};

// ✅ Restituisce l'utente attualmente loggato dal sessionStorage
export const getCurrentUser = (): User | null => {
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
    
    let userTreeData: UserTree | null = null;
    if (userTreeSnap.exists()) {
      userTreeData = userTreeSnap.data() as UserTree;
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
export const getUserTrees = async (username: string): Promise<UserTree[]> => {
  try {
    const userDocRef = doc(db, 'user-tree', username);
    const userDocSnap: DocumentSnapshot = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {});
      console.log('🆕 Creato nuovo documento user-tree per', username);
      return [];
    }

    const treeCollectionRef = collection(userDocRef, 'tree');
    const querySnapshot: QuerySnapshot = await getDocs(treeCollectionRef);
    
    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const tree: UserTree = {
        soprannome: data.soprannome || 'Senza nome',
        specie: data.specie || 'Specie sconosciuta',
        luogo: data.luogo || 'Comune sconosciuto',
        regione: data.regione || 'Regione sconosciuta',
        coordinates: data.coordinates || '',
        comments: data.comments || [],
      };
      return { id: docSnap.id, ...tree }; // Add the tree properties along with the document ID
    });
  } catch (error: unknown) {
    console.error('❌ Errore getUserTrees:', error);
    return [];
  }
};
