import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';

/**
 * Verifica le credenziali di login
 */
export const checkUserCredentials = async (username, password) => {
  try {
    console.log('🔐 Verifica credenziali per:', username);
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('__name__', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Utente non trovato' };
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    if (userData.password === password) {
      const user = {
        id: userDoc.id,
        username: userDoc.id,
        email: userData.email || ''
      };
      
      // Salva l'utente nel sessionStorage
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      
      return { success: true, user };
    } else {
      return { success: false, error: 'Password errata' };
    }
  } catch (error) {
    console.error('Errore verifica credenziali:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Registra un nuovo utente
 */
export const registerUser = async (username, password, email = null) => {
  try {
    console.log('📝 Registrazione nuovo utente:', username);
    
    // Verifica se l'utente esiste già
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('__name__', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { success: false, error: 'Username già esistente' };
    }
    
    // Crea il nuovo utente
    const userRef = doc(collection(db, 'users'), username);
    await setDoc(userRef, {
      password: password,
      email: email
    });
    
    const user = {
      id: username,
      username: username,
      email: email || ''
    };
    
    // Salva l'utente nel sessionStorage
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    return { success: true, user };
  } catch (error) {
    console.error('Errore registrazione:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Ottieni l'utente corrente dal sessionStorage
 */
export const getCurrentUser = () => {
  try {
    const userData = sessionStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Errore recupero utente:', error);
    return null;
  }
};

/**
 * Logout dell'utente
 */
export const logoutUser = () => {
  sessionStorage.removeItem('currentUser');
  return { success: true };
};

/**
 * Ottieni i dati completi dell'utente (incluso user-tree)
 */
export const getUserProfile = async (userId) => {
  try {
    // Ottieni dati base utente
    const userRef = doc(collection(db, 'users'), userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'Utente non trovato' };
    }
    
    const userData = userSnap.data();
    
    // Ottieni user-tree
    const userTreeRef = doc(collection(db, 'user_trees'), userId);
    const userTreeSnap = await getDoc(userTreeRef);
    
    let userTreeData = null;
    if (userTreeSnap.exists()) {
      userTreeData = userTreeSnap.data();
      
      // Ottieni dettagli commenti se presenti
      if (userTreeData.comments && userTreeData.comments.length > 0) {
        const commentsSnapshot = await getDocs(collection(db, 'comments'));
        const commentsDetails = commentsSnapshot.docs
          .filter(doc => userTreeData.comments.includes(doc.id))
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        
        userTreeData.commentsDetails = commentsDetails;
      }
    }
    
    return {
      success: true,
      data: {
        user: {
          id: userId,
          username: userId,
          email: userData.email || ''
        },
        userTree: userTreeData
      }
    };
  } catch (error) {
    console.error('Errore recupero profilo:', error);
    return { success: false, error: error.message };
  }
};