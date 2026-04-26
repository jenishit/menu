import {
  useState, useEffect, useCallback, useRef,
  type FormEvent, type ReactNode,
} from 'react';
import { Link, useNavigate }         from 'react-router-dom';
import { doc, getDoc, setDoc }       from 'firebase/firestore';
import { signOut }                   from 'firebase/auth';
import { db, auth }                  from '../../firebase';
import { useAuth }                   from '../../hooks/useAuth';
import { isFlatCategory }            from '../../types';
import type { MenuData, MenuItem }   from '../../types';


// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type ToastState = { message: string; error?: boolean } | null;

function looksLikeMenuData(val: unknown): val is MenuData {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

function errorMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code;
  if (code === 'permission-denied') {
    return 'Save blocked by Firestore rules. Allow writes to menu/main for this admin flow.';
  }
  if (code) {
    return `Save failed (${code}).`;
  }
  return 'Save failed';
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore helpers
// ─────────────────────────────────────────────────────────────────────────────
async function fetchMenu(): Promise<MenuData> {
  const snap = await getDoc(doc(db, 'menu', 'main'));
  if (snap.exists()) {
    const payload = snap.data();
    const docMenu = looksLikeMenuData(payload.data) ? payload.data : payload;
    if (looksLikeMenuData(docMenu)) return docMenu;
  }

  // Seed with default menu data on first run.
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

// ─────────────────────────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user }                       = useAuth();
  const navigate                       = useNavigate();
  const [menu,        setMenu]         = useState<MenuData | null>(null);
  const [loadError,   setLoadError]    = useState<string | null>(null);
  const [selectedCat, setSelectedCat]  = useState<string | null>(null);
  const [selectedSub, setSelectedSub]  = useState<string | null>(null);
  const [modal,       setModal]        = useState<ReactNode>(null);
  const [toast,       setToast]        = useState<ToastState>(null);
  const toastTimer                     = useRef<ReturnType<typeof setTimeout>>();

  // ── Load menu ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMenu()
      .then(data => {
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

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, error = false) => {
    setToast({ message, error });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Persist helper ─────────────────────────────────────────────────────────
  const persist = useCallback(async (next: MenuData) => {
    try {
      await saveMenu(next);
      setMenu(next);
      showToast('Saved ✓');
    } catch (err) {
      showToast(errorMessage(err), true);
    }
  }, [showToast]);

  const closeModal = () => setModal(null);

  async function logout() {
    await signOut(auth);
    navigate('/login', { replace: true });
  }

  function openSeedMenuModal() {
    const defaultMenu = getDefaultMenu();
    setModal(
      <ConfirmModal
        title="Reset Menu to Default"
        message={
          <>Replace <span className="text-gold">menu/main</span> in Firestore with the default menu data? This will overwrite all current items.</>
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

  // ─── Select category ────────────────────────────────────────────────────────
  function selectCat(cat: string) {
    setSelectedCat(cat);
    setSelectedSub(null);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD helpers
  // ─────────────────────────────────────────────────────────────────────────
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
    const val  = next[selectedCat];
    if (isFlatCategory(val)) {
      next[selectedCat] = items;
    } else if (selectedSub) {
      next[selectedCat] = { ...val, [selectedSub]: items };
    }
    return next;
  }

  // ─── Add / Edit item ────────────────────────────────────────────────────────
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

  // ─── Delete item ─────────────────────────────────────────────────────────────
  function openDeleteItem(idx: number, itemName: string) {
    setModal(
      <ConfirmModal
        title="Delete Item"
        message={<>Remove <span className="text-gold">"{itemName}"</span>? This cannot be undone.</>}
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

  // ─── Add category ────────────────────────────────────────────────────────────
  function openAddCategory() {
    setModal(
      <AddCategoryModal
        onClose={closeModal}
        onSave={async (name, type) => {
          if (!menu) return;
          const next = { ...menu, [name]: type === 'flat' ? [] : {} };
          await persist(next);
          selectCat(name);
          closeModal();
        }}
        existingNames={menu ? Object.keys(menu) : []}
      />,
    );
  }

  // ─── Delete category ─────────────────────────────────────────────────────────
  function openDeleteCategory() {
    if (!selectedCat) return;
    const name = selectedCat;
    setModal(
      <ConfirmModal
        title="Delete Category"
        message={
          <>Delete <span className="text-gold">"{name}"</span> and all its items? This cannot be undone.</>
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

  // ─── Add sub-category ─────────────────────────────────────────────────────────
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

  if (loadError && !menu) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 px-8">
      <p className="text-red-400 text-sm tracking-wide text-center max-w-md">{loadError}</p>
      <p className="text-muted/60 text-xs tracking-wide text-center max-w-md">
        Make sure your Firestore security rules allow reads/writes on the <code className="text-gold">menu/main</code> document.
      </p>
      <button
        onClick={() => { setLoadError(null); window.location.reload(); }}
        className="border border-ember/40 text-ember px-6 py-2.5 text-[10px] tracking-[0.28em] uppercase hover:bg-ember/10 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  if (!menu) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-muted text-xs tracking-[0.3em] uppercase animate-pulse">Loading…</p>
    </div>
  );

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

  return (
    <div className="min-h-screen bg-bg flex flex-col text-cream font-body font-light">

      {/* ── Top nav ────────────────────────────────────────────────────────── */}
      <nav className="flex-shrink-0 flex items-center justify-between
                      px-6 py-3 border-b border-gold/10 bg-surface/60
                      backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="text-ember text-xl leading-none">🔥</span>
          <span className="font-display text-xl font-light text-cream tracking-wide">
            <em className="italic text-gold">Aago</em> Aroma
            <span className="text-muted/40 text-sm font-body ml-2">Admin</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" target="_blank"
            className="text-[9px] tracking-[0.25em] uppercase text-muted/60 hover:text-gold transition-colors hidden sm:block">
            View Menu ↗
          </Link>
          <button
            onClick={openSeedMenuModal}
            className="text-[9px] tracking-[0.24em] uppercase text-gold/80
                       hover:text-gold transition-colors border border-gold/20 px-3 py-1.5
                       hover:border-gold/40 hidden sm:block"
          >
            Seed Menu
          </button>
          <span className="text-muted/30 hidden sm:block">|</span>
          <span className="text-[10px] tracking-wide text-muted/50 hidden sm:block truncate max-w-[180px]">
            {user?.email}
          </span>
          <button
            onClick={logout}
            className="text-[9px] tracking-[0.28em] uppercase text-muted
                       hover:text-ember transition-colors border border-gold/20 px-3 py-1.5
                       hover:border-ember/40"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="w-56 flex-shrink-0 border-r border-gold/10 bg-surface/30 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gold/10">
            <button
              onClick={openAddCategory}
              className="w-full border border-ember/40 text-ember px-4 py-2.5 text-[10px]
                         tracking-[0.28em] uppercase hover:bg-ember/10 transition-colors text-center"
            >
              + New Category
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
            {Object.keys(menu).map(cat => (
              <li
                key={cat}
                onClick={() => selectCat(cat)}
                className={[
                  'cursor-pointer px-3 py-2.5 rounded-sm text-sm font-light tracking-wide',
                  'border-l-2 transition-all duration-200 select-none',
                  cat === selectedCat
                    ? 'border-ember bg-ember/5 text-ember'
                    : 'border-transparent text-cream/70 hover:border-gold/30 hover:bg-white/[0.03] hover:text-cream',
                ].join(' ')}
              >
                {cat}
              </li>
            ))}
          </ul>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Content header */}
          <div className="flex-shrink-0 flex items-center justify-between px-8 py-5
                          border-b border-gold/10 bg-surface/20">
            <h2 className="font-display text-3xl font-light text-cream tracking-wide">
              {selectedCat ?? 'Select a category'}
            </h2>
            {selectedCat && (
              <button
                onClick={openDeleteCategory}
                className="bg-red-900/30 border border-red-500/30 text-red-400 px-5 py-2
                           text-[9px] tracking-[0.28em] uppercase hover:bg-red-900/50 transition-colors"
              >
                Delete Category
              </button>
            )}
          </div>

          {/* Scrollable area */}
          <main className="flex-1 overflow-y-auto px-8 py-6">
            {!selectedCat ? (
              <p className="text-muted text-sm tracking-wide">Select a category to manage its items.</p>
            ) : isNested ? (
              <NestedEditor
                value={catValue as Record<string, MenuItem[]>}
                activeSub={activeSub}
                onSelectSub={setSelectedSub}
                onAddSubCat={openAddSubCat}
                onAddItem={() => openItemModal(null)}
                onEditItem={openItemModal}
                onDeleteItem={openDeleteItem}
              />
            ) : (
              <FlatEditor
                items={catValue as MenuItem[]}
                onAddItem={() => openItemModal(null)}
                onEditItem={openItemModal}
                onDeleteItem={openDeleteItem}
              />
            )}
          </main>

        </div>
      </div>

      {/* ── Modal overlay ────────────────────────────────────────────────── */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          {modal}
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────── */}
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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function FlatEditor({
  items, onAddItem, onEditItem, onDeleteItem,
}: {
  items: MenuItem[];
  onAddItem: () => void;
  onEditItem: (idx: number) => void;
  onDeleteItem: (idx: number, name: string) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] tracking-[0.28em] uppercase text-muted/60">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
        <button onClick={onAddItem}
          className="border border-ember/40 text-ember px-4 py-2 text-[10px]
                     tracking-[0.28em] uppercase hover:bg-ember/10 transition-colors">
          + Add Item
        </button>
      </div>
      <ItemRows items={items} onEdit={onEditItem} onDelete={onDeleteItem} />
    </>
  );
}

function NestedEditor({
  value, activeSub, onSelectSub, onAddSubCat,
  onAddItem, onEditItem, onDeleteItem,
}: {
  value: Record<string, MenuItem[]>;
  activeSub: string | null;
  onSelectSub: (s: string) => void;
  onAddSubCat: () => void;
  onAddItem: () => void;
  onEditItem: (idx: number) => void;
  onDeleteItem: (idx: number, name: string) => void;
}) {
  const subs  = Object.keys(value);
  const items = activeSub ? (value[activeSub] ?? []) : [];

  return (
    <>
      {/* Sub-cat tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {subs.map(sub => (
          <button
            key={sub}
            onClick={() => onSelectSub(sub)}
            className={[
              'px-4 py-2 text-[10px] tracking-[0.22em] uppercase border transition-colors',
              sub === activeSub
                ? 'border-ember text-ember bg-ember/10'
                : 'border-gold/20 text-muted hover:text-cream hover:border-gold/40',
            ].join(' ')}
          >
            {sub}
          </button>
        ))}
        <button
          onClick={onAddSubCat}
          className="ml-auto border border-gold/20 text-muted/70 px-3 py-1.5
                     text-[9px] tracking-[0.22em] uppercase hover:border-gold/40 hover:text-cream transition-colors"
        >
          + Sub-category
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] tracking-[0.28em] uppercase text-muted/60">
          {activeSub} · {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
        <button onClick={onAddItem}
          className="border border-ember/40 text-ember px-4 py-2 text-[10px]
                     tracking-[0.28em] uppercase hover:bg-ember/10 transition-colors">
          + Add Item
        </button>
      </div>

      <ItemRows items={items} onEdit={onEditItem} onDelete={onDeleteItem} />
    </>
  );
}

function ItemRows({
  items, onEdit, onDelete,
}: {
  items: MenuItem[];
  onEdit: (idx: number) => void;
  onDelete: (idx: number, name: string) => void;
}) {
  if (items.length === 0) return (
    <p className="text-muted/50 text-sm tracking-wide py-8 text-center italic">
      No items yet. Add one above.
    </p>
  );
  return (
    <div className="border border-gold/[0.08] rounded-sm overflow-hidden">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="group flex items-center py-3.5 px-4 border-b border-gold/[0.08]
                     last:border-0 hover:bg-white/[0.025] transition-colors"
        >
          <span className="flex-1 text-cream/85 text-sm font-light tracking-wide leading-snug pr-4">
            {item.name}
          </span>
          <span className="font-display text-lg text-gold shrink-0 mr-4">
            <span className="text-[11px] font-body font-light opacity-60 mr-0.5">Rs.</span>
            {item.price}
          </span>
          <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(idx)}
              className="text-[9px] tracking-[0.22em] uppercase text-muted
                         hover:text-gold border border-gold/15 px-2.5 py-1
                         hover:border-gold/40 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(idx, item.name)}
              className="text-[9px] tracking-[0.22em] uppercase text-muted/60
                         hover:text-red-400 border border-gold/10 px-2.5 py-1
                         hover:border-red-500/30 transition-colors"
            >
              Del
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────
function ModalShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface border border-gold/20 p-8 w-full max-w-md relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ember/60 via-gold/40 to-transparent" />
      {children}
    </div>
  );
}

// ── Item modal ────────────────────────────────────────────────────────────────
function ItemModal({
  title, category, subCat, initial, onClose, onSave,
}: {
  title: string;
  category: string;
  subCat: string | null;
  initial: MenuItem | null;
  onClose: () => void;
  onSave: (item: MenuItem) => Promise<void>;
}) {
  const [name,  setName]  = useState(initial?.name  ?? '');
  const [price, setPrice] = useState(initial?.price?.toString() ?? '');
  const [err,   setErr]   = useState('');
  const [busy,  setBusy]  = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const p = parseInt(price, 10);
    if (!name.trim() || isNaN(p) || p < 0) { setErr('Please enter a valid name and price.'); return; }
    setBusy(true);
    await onSave({ name: name.trim(), price: p });
    setBusy(false);
  }

  return (
    <ModalShell>
      <h3 className="font-display text-3xl font-light text-cream tracking-wide mb-1 leading-tight">
        {title}
      </h3>
      {subCat && (
        <p className="text-[10px] tracking-[0.22em] uppercase text-muted mb-6">
          {category} › <span className="text-gold">{subCat}</span>
        </p>
      )}
      <form onSubmit={handleSave} className="space-y-5 mt-6">
        <div>
          <label className="block text-[10px] tracking-[0.28em] uppercase text-muted mb-1.5">Item Name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Masala Milk Tea"
            className="w-full bg-bg border border-gold/20 text-cream text-sm font-light
                       px-4 py-2.5 placeholder-muted/40 focus:outline-none focus:border-gold/50
                       transition-colors tracking-wide"
          />
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.28em] uppercase text-muted mb-1.5">Price (NPR)</label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="e.g. 150"
            className="w-full bg-bg border border-gold/20 text-cream text-sm font-light
                       px-4 py-2.5 placeholder-muted/40 focus:outline-none focus:border-gold/50
                       transition-colors tracking-wide"
          />
        </div>
        {err && <p className="text-red-400 text-xs tracking-wide">{err}</p>}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gold/10">
          <button type="button" onClick={onClose}
            className="border border-gold/20 text-muted px-6 py-2.5 text-[10px]
                       tracking-[0.28em] uppercase hover:border-gold/40 hover:text-cream transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={busy}
            className="bg-ember text-cream px-6 py-2.5 text-[10px] tracking-[0.28em]
                       uppercase hover:bg-ember/85 transition-colors disabled:opacity-40">
            {busy ? 'Saving…' : title.startsWith('Edit') ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({
  title, message, confirmLabel, danger, onClose, onConfirm,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  async function go() { setBusy(true); await onConfirm(); setBusy(false); }
  return (
    <ModalShell>
      <h3 className={`font-display text-3xl font-light tracking-wide mb-4 ${danger ? 'text-red-400/90' : 'text-cream'}`}>
        {title}
      </h3>
      <p className="text-cream/60 text-sm tracking-wide leading-relaxed">{message}</p>
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gold/10">
        <button onClick={onClose}
          className="border border-gold/20 text-muted px-6 py-2.5 text-[10px]
                     tracking-[0.28em] uppercase hover:border-gold/40 hover:text-cream transition-colors">
          Cancel
        </button>
        <button onClick={go} disabled={busy}
          className={[
            'px-6 py-2.5 text-[10px] tracking-[0.28em] uppercase transition-colors disabled:opacity-40',
            danger
              ? 'bg-red-900/30 border border-red-500/30 text-red-400 hover:bg-red-900/50'
              : 'bg-ember text-cream hover:bg-ember/85',
          ].join(' ')}>
          {busy ? '…' : confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}

// ── Add category modal ────────────────────────────────────────────────────────
function AddCategoryModal({
  existingNames, onClose, onSave,
}: {
  existingNames: string[];
  onClose: () => void;
  onSave: (name: string, type: 'flat' | 'nested') => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'flat' | 'nested'>('flat');
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!name.trim())                  { setErr('Please enter a category name.'); return; }
    if (existingNames.includes(name.trim())) { setErr('That category already exists.'); return; }
    setBusy(true);
    await onSave(name.trim(), type);
    setBusy(false);
  }

  return (
    <ModalShell>
      <h3 className="font-display text-3xl font-light text-cream tracking-wide mb-6">New Category</h3>
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-[10px] tracking-[0.28em] uppercase text-muted mb-1.5">Category Name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Desserts"
            className="w-full bg-bg border border-gold/20 text-cream text-sm font-light
                       px-4 py-2.5 placeholder-muted/40 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.28em] uppercase text-muted mb-1.5">Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as 'flat' | 'nested')}
            className="w-full bg-bg border border-gold/20 text-cream text-sm font-light
                       px-4 py-2.5 focus:outline-none focus:border-gold/50 transition-colors cursor-pointer"
          >
            <option value="flat">Simple list — items with name & price</option>
            <option value="nested">Grouped — sub-categories (like Momo, Pizza)</option>
          </select>
        </div>
        {err && <p className="text-red-400 text-xs tracking-wide">{err}</p>}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gold/10">
          <button type="button" onClick={onClose}
            className="border border-gold/20 text-muted px-6 py-2.5 text-[10px]
                       tracking-[0.28em] uppercase hover:border-gold/40 hover:text-cream transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={busy}
            className="bg-ember text-cream px-6 py-2.5 text-[10px] tracking-[0.28em]
                       uppercase hover:bg-ember/85 transition-colors disabled:opacity-40">
            {busy ? 'Adding…' : 'Add Category'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Add sub-category modal ────────────────────────────────────────────────────
function AddSubCatModal({
  parent, existing, onClose, onSave,
}: {
  parent: string;
  existing: string[];
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!name.trim())             { setErr('Please enter a name.'); return; }
    if (existing.includes(name.trim())) { setErr('That sub-category already exists.'); return; }
    setBusy(true);
    await onSave(name.trim());
    setBusy(false);
  }

  return (
    <ModalShell>
      <h3 className="font-display text-3xl font-light text-cream tracking-wide mb-1">New Sub-category</h3>
      <p className="text-[10px] tracking-[0.22em] uppercase text-muted mb-6">
        inside <span className="text-gold">{parent}</span>
      </p>
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-[10px] tracking-[0.28em] uppercase text-muted mb-1.5">Name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Prawn"
            className="w-full bg-bg border border-gold/20 text-cream text-sm font-light
                       px-4 py-2.5 placeholder-muted/40 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>
        {err && <p className="text-red-400 text-xs tracking-wide">{err}</p>}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gold/10">
          <button type="button" onClick={onClose}
            className="border border-gold/20 text-muted px-6 py-2.5 text-[10px]
                       tracking-[0.28em] uppercase hover:border-gold/40 hover:text-cream transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={busy}
            className="bg-ember text-cream px-6 py-2.5 text-[10px] tracking-[0.28em]
                       uppercase hover:bg-ember/85 transition-colors disabled:opacity-40">
            {busy ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Default menu data — used to seed Firestore on first run or reset
// ─────────────────────────────────────────────────────────────────────────────
function getDefaultMenu(): MenuData {
  return {
    "Shake the heat off": [
      { name: "Vanilla Milkshake",   price: 180 },
      { name: "Chocolate Milkshake", price: 200 },
      { name: "Oreo Milkshake",      price: 230 },
    ],
    "Special Combo": {
      "Medium Combo": [
        { name: "Chicken Chhoila + Waiwai sadheko + Chicken Mo:mo + Popcorn/Chiura + Choice of drink for 3", price: 999 },
      ],
      "Jumbo Combo": [
        { name: "Chicken Chhoila + Potato wedges + Waiwai sadheko + Peanuts sadheko + Aago Aroma Supreme Pizza (Veg/Non Veg) + Popcorn + Buffalo wings + Premium Cloud Hukka + Choice of Drink for 5", price: 2699 },
      ],
      "Veg Combo": [
        { name: "Mustang Aloo + Mushroom Chhoila + Waiwai sadheko + Popcorn/Chiura + Choice of drink for 3", price: 999 },
      ],
    },
    "Tea": [
      { name: "Milk Tea",                      price: 25 },
      { name: "Masala Milk Tea",               price: 40 },
      { name: "Black Tea",                     price: 20 },
      { name: "Masala Black Tea",              price: 30 },
      { name: "Lemon Tea",                     price: 25 },
      { name: "Hot Lemon",                     price: 40 },
      { name: "Hot Lemon w/ Honey",            price: 60 },
      { name: "Hot Lemon Honey w/ Ginger",     price: 80 },
      { name: "Chamomile Tea",                 price: 50 },
      { name: "Fruit Tea",                     price: 50 },
    ],
    "Coffee": [
      { name: "Milk Coffee",  price: 100 },
      { name: "Black Coffee", price: 80  },
    ],
    "Refreshing Drinks": [
      { name: "Fresh Lime Soda",        price: 120 },
      { name: "Mint Lemonade",          price: 150 },
      { name: "Virgin Mojito",          price: 180 },
      { name: "Fresh Watermelon Juice", price: 150 },
      { name: "Watermelon Mojito",      price: 200 },
      { name: "Fresh ABC Juice",        price: 250 },
      { name: "Coke/Fanta/Sprite",      price: 100 },
    ],
    "Fire Wood Bakery Items": [
      { name: "Donut",             price: 25  },
      { name: "Chocolate Donut",   price: 50  },
      { name: "Cinnamon Roll",     price: 50  },
      { name: "Chicken Patty",     price: 90  },
      { name: "Chocolate Brownie", price: 100 },
    ],
    "Veg Snacks": [
      { name: "Pop Corn",         price: 80  },
      { name: "Peanuts Sadheko",  price: 100 },
      { name: "Chowchow sadheko", price: 100 },
      { name: "Nachos",           price: 150 },
      { name: "French Fries",     price: 150 },
      { name: "Chips Chilly",     price: 180 },
      { name: "Mustang Aalu",     price: 180 },
      { name: "Mushroom Chhoila", price: 200 },
      { name: "Mushroom Chilly",  price: 200 },
      { name: "Paner Chilly",     price: 250 },
      { name: "Cheese balls",     price: 300 },
    ],
    "Non-Veg Snacks": [
      { name: "Spicy Chicken Wings",          price: 320 },
      { name: "Fried/Boiled Chicken Sausage", price: 250 },
      { name: "Chicken Chilly",               price: 280 },
      { name: "Chicken Chhoila",              price: 280 },
      { name: "Smoked Chicken Sadheko",       price: 320 },
    ],
    "Momo": {
      "Buff": [
        { name: "Steam Buff Momo",   price: 150 },
        { name: "Fried Buff Momo",   price: 170 },
        { name: "Jhol Buff Momo",    price: 180 },
        { name: "Buff Kothey Momo",  price: 180 },
        { name: "Chhoila Buff Momo", price: 190 },
        { name: "Buff Chilly Momo",  price: 190 },
      ],
      "Chicken": [
        { name: "Steam Chicken Momo",   price: 180 },
        { name: "Fried Chicken Momo",   price: 200 },
        { name: "Chicken Kothey Momo",  price: 210 },
        { name: "Jhol Chicken Momo",    price: 210 },
        { name: "Chhoila Chicken Momo", price: 220 },
        { name: "Chicken Chilly Momo",  price: 220 },
      ],
    },
    "Chowmein": [
      { name: "Veg Chowmein",     price: 120 },
      { name: "Egg Chowmein",     price: 150 },
      { name: "Chicken Chowmein", price: 180 },
      { name: "Mixed Chowmein",   price: 210 },
    ],
    "Thukpa": [
      { name: "Veg Thukpa",     price: 150 },
      { name: "Egg Thukpa",     price: 220 },
      { name: "Chicken Thukpa", price: 210 },
      { name: "Mixed Thhukpa",  price: 230 },
    ],
    "Fire Wood Pizza": {
      "Large size 12 inch": [
        { name: "Margherita Pizza",              price: 500 },
        { name: "Grilled Mushroom Pizza",        price: 600 },
        { name: "Veg Paradise Pizza",            price: 650 },
        { name: "Smoked Chicken Pizza",          price: 700 },
        { name: "Ham Hawaiian Pizza",            price: 700 },
        { name: "Pepperoni Chicken Pizza",       price: 750 },
        { name: "Smoked Chicken Hawaiian Pizza", price: 775 },
        { name: "Meat Lover Pizza",              price: 800 },
        { name: "Aago Aroma Supreme Pizza",      price: 900 },
      ],
    },
    "Extra Toppings": [
      { name: "Onion",                  price: 20  },
      { name: "Capsicum",               price: 30  },
      { name: "Mushroom",               price: 60  },
      { name: "Pineapple",              price: 75  },
      { name: "Black Olive/Green Olive", price: 90 },
      { name: "Kanchan Cheese",         price: 90  },
      { name: "Mozarella Cheese",       price: 120 },
      { name: "Chicken Pepperoni",      price: 60  },
      { name: "Sausage",                price: 60  },
      { name: "Smoked Chicken",         price: 110 },
      { name: "Salami",                 price: 60  },
      { name: "Ham",                    price: 80  },
      { name: "Bacon Pepperoni",        price: 110 },
    ],
    "Hukka": [
      { name: "Mint",             price: 400 },
      { name: "Havana",           price: 400 },
      { name: "Hawaii",           price: 400 },
      { name: "Paan",             price: 400 },
      { name: "Double Melon Ice", price: 400 },
    ],
    "Cigarettes": [
      { name: "Shikhar Ice",  price: 25 },
      { name: "Surya Red",    price: 30 },
      { name: "Surya Fusion", price: 30 },
      { name: "Surya Light",  price: 30 },
    ],
  };
}