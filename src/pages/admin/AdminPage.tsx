import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { isFlatCategory } from '../../types';
import type { MenuData, MenuItem } from '../../types';
import { getDefaultMenu } from '../../data/defaultMenu';
import FlatEditor from './components/FlatEditor';
import NestedEditor from './components/NestedEditor';
import ItemModal from './components/ItemModal';
import ConfirmModal from './components/ConfirmModal';
import AddCategoryModal from './components/AddCategoryModal';
import AddSubCatModal from './components/AddSubCatModal';

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

// ── Firestore helpers ───────────────────────────────────────────────────────
async function fetchMenu(): Promise<MenuData> {
  const snap = await getDoc(doc(db, 'menu', 'main'));
  if (snap.exists()) {
    const payload = snap.data();
    const docMenu = looksLikeMenuData(payload.data) ? payload.data : payload;
    if (looksLikeMenuData(docMenu)) return docMenu;
  }

  // Seed with default menu data on first run
  const defaultMenu = getDefaultMenu();
  try {
    await setDoc(doc(db, 'menu', 'main'), { data: defaultMenu });
    return defaultMenu;
  } catch (e) {
    console.error('Failed to seed default menu:', e);
    return defaultMenu;
  }
}

async function saveMenu(data: MenuData): Promise<void> {
  await setDoc(doc(db, 'menu', 'main'), { data });
}

// ── Root component ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [modal, setModal] = useState<ReactNode>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [draggedCatIdx, setDraggedCatIdx] = useState<number | null>(null);
  const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Load menu ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMenu()
      .then((data) => {
        setMenu(data);
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
    async (next: MenuData) => {
      try {
        await saveMenu(next);
        setMenu(next);
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
  function handleCategoryDragStart(idx: number) {
    setDraggedCatIdx(idx);
  }

  function handleCategoryDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleCategoryDrop(targetIdx: number) {
    if (draggedCatIdx === null || draggedCatIdx === targetIdx || !menu) return;
    
    const cats = Object.keys(menu);
    const newCats = [...cats];
    const [draggedCat] = newCats.splice(draggedCatIdx, 1);
    newCats.splice(targetIdx, 0, draggedCat);
    
    // Rebuild menu in new order
    const next: MenuData = {};
    newCats.forEach((cat, idx) => {
      next[cat] = menu[cat];
      // Update category sort_order in all items
      const catVal = menu[cat];
      if (isFlatCategory(catVal)) {
        next[cat] = catVal.map((item) => ({
          ...item,
          sort_order: (item.sort_order ?? 0) + (targetIdx - draggedCatIdx) * 1000,
        }));
      }
    });
    
    persist(next);
    setDraggedCatIdx(null);
    if (selectedCat === cats[draggedCatIdx]) {
      setSelectedCat(draggedCat);
    }
  }

  // ── Item drag & drop ───────────────────────────────────────────────────────
  function handleItemDragStart(idx: number) {
    setDraggedItemIdx(idx);
  }

  function handleItemDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleItemDrop(targetIdx: number) {
    if (draggedItemIdx === null || draggedItemIdx === targetIdx) return;

    const items = [...getItems()];
    const [draggedItem] = items.splice(draggedItemIdx, 1);
    items.splice(targetIdx, 0, draggedItem);

    // Update sort_order for all items based on new position
    const updatedItems = items.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    const next = updateItems(updatedItems);
    if (next) persist(next);
    setDraggedItemIdx(null);
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
          if (next) await persist(next);
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
          if (next) await persist(next);
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
        onSave={async (name, type, _sortOrder) => {
          if (!menu) return;
          const next = { ...menu, [name]: type === 'flat' ? [] : {} };
          // TODO: sortOrder can be stored in a separate metadata collection in Firestore if needed
          await persist(next);
          selectCat(name);
          closeModal();
        }}
        existingNames={menu ? Object.keys(menu) : []}
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
          await persist(next);
          const remaining = Object.keys(next);
          setSelectedCat(remaining[0] ?? null);
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
            await saveMenu(defaultMenu);
            setMenu(defaultMenu);
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
          await persist(next);
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
            {Object.keys(menu).map((cat, idx) => (
              <li
                key={cat}
                draggable
                onDragStart={() => handleCategoryDragStart(idx)}
                onDragOver={handleCategoryDragOver}
                onDrop={() => handleCategoryDrop(idx)}
                onDragEnd={() => setDraggedCatIdx(null)}
                onClick={() => selectCat(cat)}
                className={[
                  'cursor-move px-3 py-2.5 rounded-sm text-sm font-light tracking-wide',
                  'border-l-2 transition-all duration-200 select-none',
                  draggedCatIdx === idx ? 'opacity-50 bg-gold/10' : '',
                  cat === selectedCat
                    ? 'border-ember bg-ember/5 text-ember'
                    : 'border-transparent text-cream/70 hover:border-gold/30 hover:bg-white/3 hover:text-cream',
                ].join(' ')}
              >
                {cat}
              </li>
            ))}
          </ul>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content header */}
          <div
            className="shrink-0 flex items-center justify-between px-8 py-5
                       border-b border-gold/10 bg-surface/20"
          >
            <h2 className="font-display text-3xl font-light text-cream tracking-wide">
              {selectedCat ?? 'Select a category'}
            </h2>
            {selectedCat && (
              <button
                onClick={openDeleteCategory}
                className="bg-red-900/30 border border-red-500/30 text-red-400
                           px-5 py-2 text-[9px] tracking-[0.28em] uppercase
                           hover:bg-red-900/50 transition-colors"
              >
                Delete Category
              </button>
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
                onReorderItem={handleItemDrop}
              />
            ) : (
              <FlatEditor
                items={catValue as MenuItem[]}
                onAddItem={() => openItemModal(null)}
                onEditItem={openItemModal}
                onDeleteItem={openDeleteItem}
                onReorderItem={handleItemDrop}
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