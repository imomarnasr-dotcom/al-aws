import { useState, useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export const useCloudStorage = (collectionName, documentName = 'all_data', initialValue = []) => {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);

  const updateLocalStorage = (val) => {
    try {
      if (collectionName === 'lessons') {
        const master = JSON.parse(localStorage.getItem('GLOBAL_ACADEMIC_MASTER') || '{}');
        master.lessons = val;
        localStorage.setItem('GLOBAL_ACADEMIC_MASTER', JSON.stringify(master));
        localStorage.setItem('moo_global_schedule', JSON.stringify(val));
      } else if (collectionName === 'exams') {
        localStorage.setItem('exams', JSON.stringify(val));
      } else {
        localStorage.setItem('moo_' + collectionName, JSON.stringify(val));
      }
      // Dispatch event to trigger listeners in components like App.jsx and dataManager
      window.dispatchEvent(new CustomEvent('moo-sync'));
    } catch(e) {
      console.error('Local mirror error:', e);
    }
  };

  // Read from Firestore in real-time
  useEffect(() => {
    const docRef = doc(db, collectionName, documentName);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      let val = initialValue;
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data;
        val = cloudData !== undefined ? cloudData : initialValue;
      }
      setData(val);
      updateLocalStorage(val);
      setLoading(false);
      isFirstLoad.current = false;
    }, (error) => {
      console.error(`Error subscribing to ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, documentName]);

  // Write to Firestore
  const setCloudData = async (newData) => {
    // 1. Update local state immediately for snappy UI
    const valueToStore = newData instanceof Function ? newData(data) : newData;
    setData(valueToStore);
    updateLocalStorage(valueToStore);

    // 2. Sync to cloud
    try {
      const docRef = doc(db, collectionName, documentName);
      await setDoc(docRef, { data: valueToStore }, { merge: true });
    } catch (error) {
      console.error(`Error saving ${collectionName} to cloud:`, error);
    }
  };

  return [data, setCloudData, loading];
};

