import { useState, useEffect } from 'react';
import { subscribeToCollection, saveDoc, removeDoc } from './dbService';

export const useCollection = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCollection(collectionName, (fetchedData) => {
      setData(fetchedData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName]);

  const addOrUpdate = async (docId, docData) => {
    return await saveDoc(collectionName, docId, docData);
  };

  const remove = async (docId) => {
    return await removeDoc(collectionName, docId);
  };

  return { data, loading, addOrUpdate, remove };
};
