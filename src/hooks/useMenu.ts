import { useState, useEffect } from 'react';
import { doc, getDoc }         from 'firebase/firestore';
import { db }                  from '../firebase';
import type { MenuData }       from '../types';

function looksLikeMenuData(val: unknown): val is MenuData {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

export function useMenu() {
  const [menu,    setMenu]    = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'menu', 'main'));
        if (snap.exists()) {
          const payload = snap.data();
          const docMenu = looksLikeMenuData(payload.data) ? payload.data : payload;
          if (looksLikeMenuData(docMenu)) {
            setMenu(docMenu);
            return;
          }
        }
        setError('Menu not found. Please ask an admin to seed the menu data.');
      } catch (e) {
        setError('Failed to load menu. Please try again later.');
        console.error('Firestore menu load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { menu, loading, error };
}