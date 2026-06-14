import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { isFlatCategory } from '../../types';
import type { MenuData, MenuItem, MenuMetadata } from '../../types';
import { getDefaultMenu } from '../../data/defaultMenu';
import FlatEditor from './components/FlatEditor';
import NestedEditor from './components/NestedEditor';
import ItemModal from './components/ItemModal';
import ConfirmModal from './components/ConfirmModal';
import AddCategoryModal from './components/AddCategoryModal';
import AddSubCatModal from './components/AddSubCatModal';
import RenameCategoryModal from './components/RenameCategoryModal';

// ── Types & helpers ─────────────────────────────────────────────────────────
type ToastState = { message: string; error?: boolean } | null;

function looksLikeMenuData(val: unknown): val is MenuData {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

function errorMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code;
  if (code === 'permission-denied') {
    return 'Save blocked by Firestore rules. Allow writes to menu/main for this admin flow.';
  }
  if (code) return `Save failed (${code}).`;
  return 'Save failed';
}

/** Build initial categoryMeta from existing category keys (sorted by their current order) */
function buildInitialMeta(keys: string[], existing: MenuMetadata): MenuMetadata {
  const meta: MenuMetadata = { ...existing };
  keys.forEach((key, idx) => {
    if (!meta[key]) meta[key] = { sort_order: idx };
    else if (meta[key].sort_order === undefined) meta[key] = { ...meta[key], sort_order: idx };
  });
  return meta;
}

// ── Firestore helpers ───────────────────────────────────────────────────────

/** Sort items within a category by their sort_order field.
 * Items without sort_order keep their original array position (stable fallback). */
function sortItems(val: import('../../types').CategoryValue): import('../../types').CategoryValue {
  const stableSort = (arr: MenuItem[]) =>
    arr
      .map((item, i) => ({ item, i }))
      .sort((a, b) => {
        const aOrd = a.item.sort_order ?? null;
        const bOrd = b.item.sort_order ?? null;
        // Both have sort_order: numeric comparison
        if (aOrd !== null && bOrd !== null) return aOrd - bOrd;
        // Only one has sort_order: ordered items come first
        if (aOrd !== null) return -1;
        if (bOrd !== null) return 1;
        // Neither has sort_order: preserve original position
        return a.i - b.i;
      })
      .map(({ item }) => item);

  if (isFlatCategory(val)) {
    return stableSort(val);
  }
  const result: Record<string, MenuItem[]> = {};
  for (const [sub, items] of Object.entries(val as Record<string, MenuItem[]>)) {
    result[sub] = stableSort(items);
  }
  return result as import('../../types').CategoryValue;
}

async function fetchMenu(): Promise<{ menu: MenuData; meta: MenuMetadata }> {
  const snap = await getDoc(doc(db, 'menu', 'main'));
  if (snap.exists()) {
    const payload = snap.data();
    const docMenu = looksLikeMenuData(payload.data) ? payload.data : payload;
    const docMeta: MenuMetadata = (payload.categoryMeta as MenuMetadata) ?? {};
    if (looksLikeMenuData(docMenu)) {
      const meta = buildInitialMeta(Object.keys(docMenu), docMeta);
      // Sort items within each category by sort_order
      const sortedMenu: MenuData = {};
      for (const key of Object.keys(docMenu)) {
        sortedMenu[key] = sortItems(docMenu[key]) as MenuData[string];
      }
      return { menu: sortedMenu, meta };
    }
  }

  // Seed with default menu data on first run
  const defaultMenu = getDefaultMenu();
  const defaultMeta: MenuMetadata = {};
  Object.keys(defaultMenu).forEach((key, idx) => {
    defaultMeta[key] = { sort_order: idx };
  });
  try {
    await setDoc(doc(db, 'menu', 'main'), { data: defaultMenu, categoryMeta: defaultMeta });
  } catch (e) {
    console.error('Failed to seed default menu:', e);
  }
  return { menu: defaultMenu, meta: defaultMeta };
}

async function saveMenu(data: MenuData, meta: MenuMetadata): Promise<void> {
  await setDoc(doc(db, 'menu', 'main'), { data, categoryMeta: meta });
}

// ── Root component ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [categoryMeta, setCategoryMeta] = useState<MenuMetadata>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [modal, setModal] = useState<ReactNode>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [draggedCatIdx, setDraggedCatIdx] = useState<number | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Load menu ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMenu()
      .then(({ menu: data, meta }) => {
        setMenu(data);
        setCategoryMeta(meta);
        setLoadError(null);
        const first = Object.keys(data)[0];
        if (first) setSelectedCat(first);
      })
      .catch((err) => {
        const msg = errorMessage(err);
        setLoadError(msg);
        showToast(msg, true);
      });
  }, []);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, error = false) => {
    setToast({ message, error });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Persist helper ────────────────────────────────────────────────────────
  const persist = useCallback(
    async (next: MenuData, nextMeta: MenuMetadata) => {
      try {
        await saveMenu(next, nextMeta);
        setMenu(next);
        setCategoryMeta(nextMeta);
        showToast('Saved ✓');
      } catch (err) {
        showToast(errorMessage(err), true);
      }
    },
    [showToast],
  );

  const closeModal = () => setModal(null);

  async function logout() {
    await signOut(auth);
    navigate('/login', { replace: true });
  }

  // ── Select category ───────────────────────────────────────────────────────
  function selectCat(cat: string) {
    setSelectedCat(cat);
    setSelectedSub(null);
  }

  // ── CRUD helpers ──────────────────────────────────────────────────────────
  function getItems(): MenuItem[] {
    if (!menu || !selectedCat) return [];
    const val = menu[selectedCat];
    if (isFlatCategory(val)) return val;
    if (selectedSub) return val[selectedSub] ?? [];
    return [];
  }

  function updateItems(items: MenuItem[]) {
    if (!menu || !selectedCat) return;
    const next = { ...menu };
    const val = next[selectedCat];
    if (isFlatCategory(val)) {
      next[selectedCat] = items;
    } else if (selectedSub) {
      next[selectedCat] = { ...val, [selectedSub]: items };
    }
    return next;
  }

  // ── Category drag & drop ───────────────────────────────────────────────────
  // NOTE: drag indices refer to positions in `sortedCats`, NOT Object.keys(menu)
  function handleCategoryDragStart(idx: number) {
    setDraggedCatIdx(idx);
  }

  function handleCategoryDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleCategoryDrop(targetIdx: number, sortedCatsSnapshot: string[]) {
    if (draggedCatIdx === null || draggedCatIdx === targetIdx || !menu) return;

    // Work with sortedCats order (matches what's rendered in the sidebar)
    const newCats = [...sortedCatsSnapshot];
    const [draggedCat] = newCats.splice(draggedCatIdx, 1);
    newCats.splice(targetIdx, 0, draggedCat);

    // Rebuild menu object in new order
    const next: MenuData = {};
    newCats.forEach((cat) => {
      next[cat] = menu[cat];
    });

    // Update sort_order in categoryMeta to reflect new positions
    const nextMeta = { ...categoryMeta };
    newCats.forEach((cat, idx) => {
      nextMeta[cat] = { ...nextMeta[cat], sort_order: idx };
    });

    setDraggedCatIdx(null);
    persist(next, nextMeta);
  }

  // ── Toggle category hidden ────────────────────────────────────────────────
  function toggleCategoryHide(cat: string) {
    if (!menu) return;
    const nextMeta = { ...categoryMeta };
    nextMeta[cat] = { ...nextMeta[cat], hidden: !nextMeta[cat]?.hidden };
    persist(menu, nextMeta);
  }

  // ── Item drag & drop ───────────────────────────────────────────────────────
  function handleItemDrop(targetIdx: number, fromIdx: number) {
    if (fromIdx === targetIdx) return;

    const items = [...getItems()];
    const [draggedItem] = items.splice(fromIdx, 1);
    items.splice(targetIdx, 0, draggedItem);

    // Update sort_order for all items based on new position
    const updatedItems = items.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    const next = updateItems(updatedItems);
    if (next) persist(next, categoryMeta);
  }

  // ── Toggle item hidden ────────────────────────────────────────────────────
  function toggleItemHide(idx: number) {
    const items = [...getItems()];
    items[idx] = { ...items[idx], hidden: !items[idx].hidden };
    const next = updateItems(items);
    if (next) persist(next, categoryMeta);
  }

  // ── Add / Edit item ───────────────────────────────────────────────────────
  function openItemModal(editIdx: number | null) {
    const existing = editIdx !== null ? getItems()[editIdx] : null;
    setModal(
      <ItemModal
        title={editIdx !== null ? 'Edit Item' : 'Add Item'}
        category={selectedCat ?? ''}
        subCat={selectedSub}
        initial={existing}
        onClose={closeModal}
        onSave={async (item) => {
          const items = [...getItems()];
          if (editIdx !== null) items[editIdx] = item;
          else items.push(item);
          const next = updateItems(items);
          if (next) await persist(next, categoryMeta);
          closeModal();
        }}
      />,
    );
  }

  // ── Delete item ───────────────────────────────────────────────────────────
  function openDeleteItem(idx: number, itemName: string) {
    setModal(
      <ConfirmModal
        title="Delete Item"
        message={
          <>
            Remove <span className="text-gold">"{itemName}"</span>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        danger
        onClose={closeModal}
        onConfirm={async () => {
          const items = [...getItems()];
          items.splice(idx, 1);
          const next = updateItems(items);
          if (next) await persist(next, categoryMeta);
          closeModal();
        }}
      />,
    );
  }

  // ── Add category ──────────────────────────────────────────────────────────
  function openAddCategory() {
    setModal(
      <AddCategoryModal
        onClose={closeModal}
        onSave={async (name, type) => {
          if (!menu) return;
          const next = { ...menu, [name]: type === 'flat' ? [] : {} };
          const nextMeta = { ...categoryMeta, [name]: { sort_order: Object.keys(menu).length } };
          await persist(next, nextMeta);
          selectCat(name);
          closeModal();
        }}
        existingNames={menu ? Object.keys(menu) : []}
      />,
    );
  }

  // ── Rename category ───────────────────────────────────────────────────────
  function openRenameCategory() {
    if (!selectedCat || !menu) return;
    const oldName = selectedCat;
    setModal(
      <RenameCategoryModal
        currentName={oldName}
        existingNames={Object.keys(menu).filter((k) => k !== oldName)}
        onClose={closeModal}
        onSave={async (newName: string) => {
          if (!menu) return;
          // Rebuild menu with renamed key, preserving order
          const next: MenuData = {};
          const nextMeta = { ...categoryMeta };
          for (const key of Object.keys(menu)) {
            if (key === oldName) {
              next[newName] = menu[oldName];
              nextMeta[newName] = { ...nextMeta[oldName] };
              delete nextMeta[oldName];
            } else {
              next[key] = menu[key];
            }
          }
          await persist(next, nextMeta);
          setSelectedCat(newName);
          closeModal();
        }}
      />,
    );
  }

  // ── Delete category ───────────────────────────────────────────────────────
  function openDeleteCategory() {
    if (!selectedCat) return;
    const name = selectedCat;
    setModal(
      <ConfirmModal
        title="Delete Category"
        message={
          <>
            Delete <span className="text-gold">"{name}"</span> and all its items? This cannot
            be undone.
          </>
        }
        confirmLabel="Delete Category"
        danger
        onClose={closeModal}
        onConfirm={async () => {
          if (!menu) return;
          const next = { ...menu };
          delete next[name];
          // Re-number sort_order for remaining cats in one shot
          const nextMeta = { ...categoryMeta };
          delete nextMeta[name];
          Object.keys(next).forEach((k, i) => {
            nextMeta[k] = { ...nextMeta[k], sort_order: i };
          });
          await persist(next, nextMeta);
          setSelectedCat(Object.keys(next)[0] ?? null);
          setSelectedSub(null);
          closeModal();
        }}
      />,
    );
  }

  // ── Seed / reset menu ─────────────────────────────────────────────────────
  function openSeedMenuModal() {
    const defaultMenu = getDefaultMenu();
    setModal(
      <ConfirmModal
        title="Reset Menu to Default"
        message={
          <>
            Replace <span className="text-gold">menu/main</span> in Firestore with the default
            menu data? This will overwrite all current items.
          </>
        }
        confirmLabel="Reset"
        danger
        onClose={closeModal}
        onConfirm={async () => {
          try {
            const defaultMeta: MenuMetadata = {};
            Object.keys(defaultMenu).forEach((key, idx) => {
              defaultMeta[key] = { sort_order: idx };
            });
            await saveMenu(defaultMenu, defaultMeta);
            setMenu(defaultMenu);
            setCategoryMeta(defaultMeta);
            const first = Object.keys(defaultMenu)[0] ?? null;
            setSelectedCat(first);
            setSelectedSub(null);
            showToast('Menu reset to default ✓');
          } catch (err) {
            showToast(errorMessage(err), true);
          } finally {
            closeModal();
          }
        }}
      />,
    );
  }

  // ── Add sub-category ──────────────────────────────────────────────────────
  function openAddSubCat() {
    if (!menu || !selectedCat) return;
    const val = menu[selectedCat];
    if (isFlatCategory(val)) return;
    setModal(
      <AddSubCatModal
        parent={selectedCat}
        existing={Object.keys(val)}
        onClose={closeModal}
        onSave={async (name) => {
          const next = { ...menu };
          next[selectedCat] = { ...(val as Record<string, MenuItem[]>), [name]: [] };
          await persist(next, categoryMeta);
          setSelectedSub(name);
          closeModal();
        }}
      />,
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (loadError && !menu) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 px-8">
        <p className="text-red-400 text-sm tracking-wide text-center max-w-md">{loadError}</p>
        <p className="text-muted/60 text-xs tracking-wide text-center max-w-md">
          Make sure your Firestore security rules allow reads/writes on the{' '}
          <code className="text-gold">menu/main</code> document.
        </p>
        <button
          onClick={() => {
            setLoadError(null);
            window.location.reload();
          }}
          className="border border-ember/40 text-ember px-6 py-2.5 text-[10px]
                     tracking-[0.28em] uppercase hover:bg-ember/10 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!menu) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-muted text-xs tracking-[0.3em] uppercase animate-pulse">Loading…</p>
      </div>
    );
  }

  const catValue = selectedCat ? menu[selectedCat] : null;
  const isNested = catValue !== null && catValue !== undefined && !isFlatCategory(catValue);

  // Active sub-cat with fallback
  const activeSub = (() => {
    if (!isNested || !catValue) return null;
    const subs = Object.keys(catValue as Record<string, MenuItem[]>);
    if (selectedSub && subs.includes(selectedSub)) return selectedSub;
    return subs[0] ?? null;
  })();
  if (isNested && activeSub !== selectedSub) setSelectedSub(activeSub);

  // Sorted category list for sidebar (by sort_order in meta)
  // This is the AUTHORITATIVE order used for drag-and-drop indices
  const sortedCats = Object.keys(menu).slice().sort((a, b) => {
    const aOrder = categoryMeta[a]?.sort_order ?? Infinity;
    const bOrder = categoryMeta[b]?.sort_order ?? Infinity;
    return aOrder - bOrder;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg flex flex-col text-cream font-body font-light">
      {/* Top nav */}
      <nav
        className="shrink-0 flex items-center justify-between px-6 py-3
                   border-b border-gold/10 bg-surface/60 backdrop-blur-sm
                   sticky top-0 z-30"
      >
        <div className="flex items-center gap-3">
          <span className="text-ember text-xl leading-none">🔥</span>
          <span className="font-display text-xl font-light text-cream tracking-wide">
            <em className="italic text-gold">Aago</em> Aroma
            <span className="text-muted/40 text-sm font-body ml-2">Admin</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            target="_blank"
            className="text-[9px] tracking-[0.25em] uppercase text-muted/60
                       hover:text-gold transition-colors hidden sm:block"
          >
            View Menu ↗
          </Link>
          <button
            onClick={openSeedMenuModal}
            className="text-[9px] tracking-[0.24em] uppercase text-gold/80
                       hover:text-gold transition-colors border border-gold/20
                       px-3 py-1.5 hover:border-gold/40 hidden sm:block"
          >
            Seed Menu
          </button>
          <span className="text-muted/30 hidden sm:block">|</span>
          <span className="text-[10px] tracking-wide text-muted/50 hidden sm:block truncate max-w-45">
            {user?.email}
          </span>
          <button
            onClick={logout}
            className="text-[9px] tracking-[0.28em] uppercase text-muted
                       hover:text-ember transition-colors border border-gold/20
                       px-3 py-1.5 hover:border-ember/40"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-gold/10 bg-surface/30 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gold/10">
            <button
              onClick={openAddCategory}
              className="w-full border border-ember/40 text-ember px-4 py-2.5
                         text-[10px] tracking-[0.28em] uppercase hover:bg-ember/10
                         transition-colors text-center"
            >
              + New Category
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
            {sortedCats.map((cat, idx) => {
              const isHidden = categoryMeta[cat]?.hidden ?? false;
              const isActive = cat === selectedCat;
              return (
                <li
                  key={cat}
                  draggable
                  onDragStart={() => handleCategoryDragStart(idx)}
                  onDragOver={handleCategoryDragOver}
                  onDrop={() => handleCategoryDrop(idx, sortedCats)}
                  onDragEnd={() => setDraggedCatIdx(null)}
                  className={[
                    'group relative flex items-center gap-1 cursor-move px-3 py-2.5 rounded-sm',
                    'border-l-2 transition-all duration-200 select-none',
                    draggedCatIdx === idx ? 'opacity-50 bg-gold/10' : '',
                    isHidden ? 'opacity-50' : '',
                    isActive
                      ? 'border-ember bg-ember/5 text-ember'
                      : 'border-transparent text-cream/70 hover:border-gold/30 hover:bg-white/3 hover:text-cream',
                  ].join(' ')}
                >
                  {/* Category name — clickable area */}
                  <span
                    className="flex-1 text-sm font-light tracking-wide leading-snug truncate"
                    onClick={() => selectCat(cat)}
                  >
                    {cat}
                    {isHidden && (
                      <span className="ml-1.5 text-[7px] tracking-[0.15em] uppercase text-amber-500/70 border border-amber-500/30 px-1 py-0.5 rounded-sm align-middle">
                        Hidden
                      </span>
                    )}
                  </span>

                  {/* Eye toggle — appears on hover */}
                  <button
                    title={isHidden ? 'Show category on menu' : 'Hide category from menu'}
                    onClick={(e) => { e.stopPropagation(); toggleCategoryHide(cat); }}
                    className={[
                      'shrink-0 text-[10px] p-1 rounded transition-all duration-150',
                      'opacity-0 group-hover:opacity-100',
                      isHidden
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-muted/50 hover:text-amber-400',
                    ].join(' ')}
                  >
                    {isHidden ? '👁' : '🚫'}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content header */}
          <div
            className="shrink-0 flex items-center justify-between px-8 py-5
                       border-b border-gold/10 bg-surface/20"
          >
            <div className="flex items-center gap-3">
              <h2 className="font-display text-3xl font-light text-cream tracking-wide">
                {selectedCat ?? 'Select a category'}
              </h2>
              {selectedCat && categoryMeta[selectedCat]?.hidden && (
                <span className="text-[9px] tracking-[0.2em] uppercase text-amber-500/80 border border-amber-500/30 px-2 py-1">
                  Hidden from menu
                </span>
              )}
            </div>
            {selectedCat && (
              <div className="flex gap-3">
                <button
                  onClick={openRenameCategory}
                  className="border border-gold/20 text-muted/70 px-4 py-2 text-[9px]
                             tracking-[0.24em] uppercase hover:text-cream hover:border-gold/40
                             transition-colors"
                >
                  ✏️ Rename
                </button>
                <button
                  onClick={() => selectedCat && toggleCategoryHide(selectedCat)}
                  className={[
                    'px-4 py-2 text-[9px] tracking-[0.24em] uppercase border transition-colors',
                    categoryMeta[selectedCat]?.hidden
                      ? 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                      : 'border-gold/20 text-muted/70 hover:text-amber-400 hover:border-amber-500/30',
                  ].join(' ')}
                >
                  {categoryMeta[selectedCat]?.hidden ? '👁 Unhide Category' : '🚫 Hide Category'}
                </button>
                <button
                  onClick={openDeleteCategory}
                  className="bg-red-900/30 border border-red-500/30 text-red-400
                             px-5 py-2 text-[9px] tracking-[0.28em] uppercase
                             hover:bg-red-900/50 transition-colors"
                >
                  Delete Category
                </button>
              </div>
            )}
          </div>

          {/* Scrollable area */}
          <main className="flex-1 overflow-y-auto px-8 py-6">
            {!selectedCat ? (
              <p className="text-muted text-sm tracking-wide">
                Select a category to manage its items.
              </p>
            ) : isNested ? (
              <NestedEditor
                value={catValue as Record<string, MenuItem[]>}
                activeSub={activeSub}
                onSelectSub={setSelectedSub}
                onAddSubCat={openAddSubCat}
                onAddItem={() => openItemModal(null)}
                onEditItem={openItemModal}
                onDeleteItem={openDeleteItem}
                onReorderItem={(from, to) => handleItemDrop(to, from)}
                onToggleHide={toggleItemHide}
              />
            ) : (
              <FlatEditor
                items={catValue as MenuItem[]}
                onAddItem={() => openItemModal(null)}
                onEditItem={openItemModal}
                onDeleteItem={openDeleteItem}
                onReorderItem={(from, to) => handleItemDrop(to, from)}
                onToggleHide={toggleItemHide}
              />
            )}
          </main>
        </div>
      </div>

      {/* Modal overlay */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                     flex items-center justify-center px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          {modal}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={[
            'fixed bottom-6 right-6 px-5 py-3 text-[10px] tracking-[0.28em] uppercase z-50',
            'border transition-opacity duration-300',
            toast.error
              ? 'bg-red-950 border-red-700/50 text-red-400'
              : 'bg-surface border-gold/30 text-gold',
          ].join(' ')}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
