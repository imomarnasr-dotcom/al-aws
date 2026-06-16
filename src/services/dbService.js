import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

// Helper to save or overwrite a document
export const saveDoc = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error(`Error saving to ${collectionName}:`, error);
    return false;
  }
};

// Helper to add a new document with an auto-generated ID
export const createDoc = async (collectionName, data) => {
  try {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding to ${collectionName}:`, error);
    return null;
  }
};

// Helper to get all documents from a collection
export const getAllDocs = async (collectionName) => {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error getting docs from ${collectionName}:`, error);
    return [];
  }
};

// Helper to get a single document
export const getSingleDoc = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error getting doc ${docId} from ${collectionName}:`, error);
    return null;
  }
};

// Helper to delete a document
export const removeDoc = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Error deleting from ${collectionName}:`, error);
    return false;
  }
};

// Real-time listener for a collection
export const subscribeToCollection = (collectionName, callback) => {
  const colRef = collection(db, collectionName);
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};
