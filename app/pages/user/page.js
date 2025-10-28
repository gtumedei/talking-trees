// utils/userHistory.js
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

export const saveVisitedTree = async (userId, treeData) => {
  try {
    await addDoc(collection(db, 'userTrees'), {
      userId,
      treeId: treeData.id || treeData.soprannome,
      treeData,
      visitedAt: new Date()
    });
  } catch (error) {
    console.error("Errore nel salvare l'albero visitato:", error);
  }
};

export const getUserTrees = async (userId) => {
  try {
    const q = query(
      collection(db, 'userTrees'),
      where('userId', '==', userId),
      orderBy('visitedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Errore nel recuperare gli alberi:", error);
    return [];
  }
};