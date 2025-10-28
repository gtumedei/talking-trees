import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';

// Genera ID randomico per i commenti
const generateRandomId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Inizializza il database Firebase con dati di esempio
 */
export const initializeFirebaseData = async () => {
  try {
    console.log('🚀 Inizializzazione database Firebase...');

    // Verifica se i dati esistono già
    const usersSnapshot = await getDocs(collection(db, 'users'));
    if (!usersSnapshot.empty) {
      console.log('⚠️  Database già inizializzato. Cancella prima i dati esistenti.');
      return { success: false, message: 'Database già inizializzato' };
    }

    // Usa una Batch Write per operazioni atomiche
    const batch = writeBatch(db);

    // Genera ID randomici per i commenti
    const commentId1 = generateRandomId();
    const commentId2 = generateRandomId();
    const commentId3 = generateRandomId();

    // 1. Crea l'utente admin (senza array comments)
    const adminUserRef = doc(collection(db, 'users'), 'admin');
    batch.set(adminUserRef, {
      password: "admin123", // Password obbligatoria
      email: "admin@alberi.it" // Email opzionale
      // Rimossa la proprietà comments
    });

    // 2. Crea user-tree con ID uguale all'ID utente e aggiungi gli ID commenti
    const userTreeRef = doc(collection(db, 'user_trees'), 'admin'); // ID = 'admin'
    batch.set(userTreeRef, {
      userId: "admin",
      treeId: ["01/A129/BG/03", "02/B456/MI/01"],
      soprannome: [
        "Roverella di Albano Sant'Alessandro", 
        "Platano di Milano"
      ],
      specie: [
        "Quercus pubescens Willd.", 
        "Platanus x acerifolia"
      ],
      luogo: [
        "Albano Sant'Alessandro, Bergamo", 
        "Milano, Parco Sempione"
      ],
      regione: ["Lombardia", "Lombardia"],
      coordinates: [
        { lat: 45.698678, lng: 9.783639 },
        { lat: 45.472195, lng: 9.175724 }
      ],
      comments: [commentId1, commentId2, commentId3], // Aggiungi ID commenti qui
      visitedAt: serverTimestamp(),
      lastVisited: serverTimestamp()
    });

    // 3. Aggiungi commenti con ID randomici
    const comment1Ref = doc(collection(db, 'comments'), commentId1);
    batch.set(comment1Ref, {
      text: "Proprio bello! Un albero maestoso con una chioma impressionante.",
      date: serverTimestamp(),
      user: "admin",
      id_tree: "01/A129/BG/03"
    });

    const comment2Ref = doc(collection(db, 'comments'), commentId2);
    batch.set(comment2Ref, {
      text: "Ci torno spesso per fare foto nelle diverse stagioni.",
      date: serverTimestamp(),
      user: "admin",
      id_tree: "01/A129/BG/03"
    });

    const comment3Ref = doc(collection(db, 'comments'), commentId3);
    batch.set(comment3Ref, {
      text: "Bellissimo platano nel cuore di Milano.",
      date: serverTimestamp(),
      user: "admin",
      id_tree: "02/B456/MI/01"
    });

    // Esegui tutte le operazioni in batch
    await batch.commit();

    console.log('✅ Database inizializzato con successo!');
    console.log('📊 Dati creati:');
    console.log('   👤 1 utente (admin) - SENZA array comments');
    console.log('   🌳 1 documento user_trees con ID "admin" - CON array comments');
    console.log('   💬 3 commenti con ID randomici');
    console.log('   📝 ID Commenti generati:', [commentId1, commentId2, commentId3]);
    
    return { 
      success: true, 
      message: 'Database inizializzato con successo!',
      commentIds: [commentId1, commentId2, commentId3]
    };

  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Cancella tutti i dati dal database (per testing)
 */
export const clearFirebaseData = async () => {
  try {
    console.log('🗑️  Cancellazione di tutti i dati...');

    const collections = ['users', 'user_trees', 'comments', 'photos'];
    
    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`✅ Cancellati tutti i documenti da ${collectionName}`);
    }

    console.log('🗑️  Tutti i dati sono stati cancellati!');
    return { success: true, message: 'Dati cancellati con successo!' };

  } catch (error) {
    console.error('❌ Errore durante la cancellazione:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verifica lo stato del database
 */
export const checkDatabaseStatus = async () => {
  try {
    console.log('🔍 Controllo stato database...');

    const collections = ['users', 'user_trees', 'comments', 'photos'];
    const status = {};

    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      status[collectionName] = {
        count: snapshot.size,
        documents: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      };
    }

    console.log('📊 Stato database:');
    console.log(`   👤 Users: ${status.users.count} documenti`);
    console.log(`   🌳 User Trees: ${status.user_trees.count} documenti`);
    console.log(`   💬 Comments: ${status.comments.count} documenti`);
    console.log(`   📸 Photos: ${status.photos.count} documenti`);

    // Mostra la struttura dei dati
    if (status.users.count > 0) {
      console.log('\n📋 Struttura Users:');
      status.users.documents.forEach(user => {
        console.log(`   ID: ${user.id}`);
        console.log(`   - Password: ${user.password ? '***' : 'non impostata'}`);
        console.log(`   - Email: ${user.email || 'non impostata'}`);
        console.log(`   - Comments: ${user.comments ? 'PRESENTE (da rimuovere)' : 'ASSENTE (corretto)'}`);
      });
    }

    if (status.comments.count > 0) {
      console.log('\n📋 Struttura Comments (ID randomici):');
      status.comments.documents.forEach(comment => {
        console.log(`   ID: ${comment.id}`);
        console.log(`   - Testo: ${comment.text}`);
        console.log(`   - Data: ${comment.date?.toDate() || 'N/A'}`);
        console.log(`   - User: ${comment.user}`);
        console.log(`   - Tree: ${comment.id_tree}`);
      });
    }

    if (status.user_trees.count > 0) {
      console.log('\n📋 Struttura User Trees:');
      status.user_trees.documents.forEach(userTree => {
        console.log(`   ID: ${userTree.id}`);
        console.log(`   - User ID: ${userTree.userId}`);
        console.log(`   - Alberi: ${userTree.treeId ? userTree.treeId.length : 0}`);
        console.log(`   - Commenti: ${userTree.comments ? userTree.comments.length : 0} commenti`);
        if (userTree.comments) {
          console.log(`   - ID Commenti: ${userTree.comments.join(', ')}`);
        }
      });
    }

    return { success: true, data: status };

  } catch (error) {
    console.error('❌ Errore durante il controllo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Funzioni aggiuntive per gestire la nuova struttura
 */

// Aggiungi un nuovo utente
export const addUser = async (userId, password, email = null) => {
  try {
    const userRef = doc(collection(db, 'users'), userId);
    await setDoc(userRef, {
      password: password,
      email: email
      // Nessun array comments
    });
    return { success: true, message: 'Utente creato con successo' };
  } catch (error) {
    console.error('Errore creazione utente:', error);
    return { success: false, error: error.message };
  }
};

// Aggiungi un commento con ID randomico
export const addComment = async (text, userId, treeId) => {
  try {
    const commentId = generateRandomId();
    
    const commentRef = doc(collection(db, 'comments'), commentId);
    await setDoc(commentRef, {
      text: text,
      date: serverTimestamp(),
      user: userId,
      id_tree: treeId
    });

    // Aggiorna l'array commenti nel user-tree corrispondente
    const userTreeRef = doc(collection(db, 'user_trees'), userId);
    const userTreeSnapshot = await getDocs(collection(db, 'user_trees'));
    const userTreeDoc = userTreeSnapshot.docs.find(doc => doc.id === userId);
    
    if (userTreeDoc) {
      const userTreeData = userTreeDoc.data();
      const updatedComments = [...(userTreeData.comments || []), commentId];
      await setDoc(userTreeRef, {
        ...userTreeData,
        comments: updatedComments
      }, { merge: true });
    } else {
      // Se non esiste user-tree, crealo
      await setDoc(userTreeRef, {
        userId: userId,
        treeId: [treeId],
        comments: [commentId],
        visitedAt: serverTimestamp(),
        lastVisited: serverTimestamp()
      });
    }

    return { 
      success: true, 
      message: 'Commento aggiunto con successo',
      commentId: commentId
    };
  } catch (error) {
    console.error('Errore aggiunta commento:', error);
    return { success: false, error: error.message };
  }
};

// Crea/aggiorna user-tree per un utente
export const updateUserTree = async (userId, treeData) => {
  try {
    const userTreeRef = doc(collection(db, 'user_trees'), userId);
    
    // Verifica se esiste già un user-tree per questo utente
    const userTreeSnapshot = await getDocs(collection(db, 'user_trees'));
    const existingUserTree = userTreeSnapshot.docs.find(doc => doc.id === userId);
    
    if (existingUserTree) {
      // Aggiorna l'esistente
      const existingData = existingUserTree.data();
      await setDoc(userTreeRef, {
        ...existingData,
        treeId: [...(existingData.treeId || []), treeData.treeId],
        soprannome: [...(existingData.soprannome || []), treeData.soprannome],
        specie: [...(existingData.specie || []), treeData.specie],
        luogo: [...(existingData.luogo || []), treeData.luogo],
        regione: [...(existingData.regione || []), treeData.regione],
        coordinates: [...(existingData.coordinates || []), treeData.coordinates],
        lastVisited: serverTimestamp()
      }, { merge: true });
    } else {
      // Crea nuovo
      await setDoc(userTreeRef, {
        userId: userId,
        treeId: [treeData.treeId],
        soprannome: [treeData.soprannome],
        specie: [treeData.specie],
        luogo: [treeData.luogo],
        regione: [treeData.regione],
        coordinates: [treeData.coordinates],
        comments: [], // Array comments vuoto
        visitedAt: serverTimestamp(),
        lastVisited: serverTimestamp()
      });
    }

    return { success: true, message: 'User-tree aggiornato con successo' };
  } catch (error) {
    console.error('Errore aggiornamento user-tree:', error);
    return { success: false, error: error.message };
  }
};

// Ottieni tutti i commenti di un utente tramite user-tree
export const getUserComments = async (userId) => {
  try {
    const userTreeSnapshot = await getDocs(collection(db, 'user_trees'));
    const userTreeDoc = userTreeSnapshot.docs.find(doc => doc.id === userId);
    
    if (!userTreeDoc) {
      return { success: false, error: 'User-tree non trovato' };
    }

    const userTreeData = userTreeDoc.data();
    const commentIds = userTreeData.comments || [];

    // Recupera i dettagli dei commenti
    const commentsSnapshot = await getDocs(collection(db, 'comments'));
    const userComments = commentsSnapshot.docs
      .filter(doc => commentIds.includes(doc.id))
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    return { 
      success: true, 
      data: userComments,
      commentIds: commentIds
    };
  } catch (error) {
    console.error('Errore recupero commenti utente:', error);
    return { success: false, error: error.message };
  }
};

// Ottieni user-tree completo di un utente
export const getUserTree = async (userId) => {
  try {
    const userTreeSnapshot = await getDocs(collection(db, 'user_trees'));
    const userTreeDoc = userTreeSnapshot.docs.find(doc => doc.id === userId);
    
    if (!userTreeDoc) {
      return { success: false, error: 'User-tree non trovato' };
    }

    const userTreeData = userTreeDoc.data();

    // Recupera i dettagli dei commenti
    const commentIds = userTreeData.comments || [];
    const commentsSnapshot = await getDocs(collection(db, 'comments'));
    const comments = commentsSnapshot.docs
      .filter(doc => commentIds.includes(doc.id))
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    return { 
      success: true, 
      data: {
        ...userTreeData,
        commentsDetails: comments
      }
    };
  } catch (error) {
    console.error('Errore recupero user-tree:', error);
    return { success: false, error: error.message };
  }
};