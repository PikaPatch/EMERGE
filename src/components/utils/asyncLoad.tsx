import { useState, useEffect } from 'react';

export const useAsyncLoad = (jsonPath, msg) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const anoPath = ''
        console.log(`loading ${msg} data`);
        const loadedData = await import(jsonPath);
        console.log(loadedData)
        setData(loadedData.default);
      } catch (e) {
        console.error(`Failed to load ${msg} data`, e);
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jsonPath, msg]);

  return { data, loading, error };
};