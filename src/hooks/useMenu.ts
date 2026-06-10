import { useState, useEffect } from 'react';
import { doc, getDoc }         from 'firebase/firestore';
import { db }                  from '../firebase';
import type { MenuData, MenuMetadata, CategoryValue } from '../types';
import { isFlatCategory } from '../types';

function looksLikeMenuData(val: unknown): val is MenuData {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

/** Strip hidden items from a category value */
function filterHiddenItems(val: CategoryValue): CategoryValue {
  if (isFlatCategory(val)) {
    return val.filter((item) => !item.hidden);
  }
  const result: Record<string, typeof val[keyof typeof val]> = {};
  for (const [sub, items] of Object.entries(val)) {
    result[sub] = (items as import('../types').MenuItem[]).filter((item) => !item.hidden);
  }
  return result as CategoryValue;
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
          const meta: MenuMetadata = (payload.categoryMeta as MenuMetadata) ?? {};

          if (looksLikeMenuData(docMenu)) {
            // Sort categories by sort_order, then filter hidden categories & items
            const sortedKeys = Object.keys(docMenu).sort((a, b) => {
              const aOrder = meta[a]?.sort_order ?? Infinity;
              const bOrder = meta[b]?.sort_order ?? Infinity;
              return aOrder - bOrder;
            });

            const visibleMenu: MenuData = {};
            for (const key of sortedKeys) {
              if (meta[key]?.hidden) continue;
              visibleMenu[key] = filterHiddenItems(docMenu[key]);
            }

            setMenu(visibleMenu);
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