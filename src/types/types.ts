// ── Menu data types ────────────────────────────────────────────────────────

export interface MenuItem {
  name:  string;
  price: number;
}

/** A simple list of items (Tea, Coffee, Snacks …) */
export type FlatCategory = MenuItem[];

/** Sub-grouped items (Momo → Buff/Chicken, Pizza → sizes, Combo → sizes) */
export type NestedCategory = Record<string, MenuItem[]>;

export type CategoryValue = FlatCategory | NestedCategory;

export type MenuData = Record<string, CategoryValue>;

// ── Type guard ─────────────────────────────────────────────────────────────
export function isFlatCategory(val: CategoryValue): val is FlatCategory {
  return Array.isArray(val);
}