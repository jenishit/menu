import { useEffect, useRef } from 'react';
import { isFlatCategory } from '../../../types';
import type { CategoryValue, MenuItem } from '../../../types';
import HukkaSection from './HukkaSection';

interface Props {
  id: string;
  name:  string;
  index: number;
  value: CategoryValue;
}

export default function CategorySection({ id, name, index, value }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Scroll-triggered reveal
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          obs.unobserve(el);
        }
      },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Special full-page layout for Hukka ────────────────────────────────
  if (name === 'Hukka') {
    return <HukkaSection id={id} name={name} index={index} value={value} />;
  }

  return (
    <div id={id} ref={ref} className="category">
      <div className="category-header">
        <h2>
          <span className="cat-num">0{index}</span>
          {name}
        </h2>
        <div className="cat-line" />
      </div>

      {name === 'Fire Wood Pizza' && !isFlatCategory(value)
        ? <PizzaSection value={value} />
        : name === 'Momo' && !isFlatCategory(value)
        ? <MomoSection value={value} />
        : !isFlatCategory(value)
        ? <ComboSection value={value} />
        : <FlatList items={value} />}
    </div>
  );
}

/* ── Flat list ───────────────────────────────────────────────────────────── */
function FlatList({ items }: { items: MenuItem[] }) {
  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="menu-item">
          <span className="item-name">{item.name}</span>
          <span className="item-dots" />
          <span className="item-price">
            <span className="currency">Rs.</span>{item.price}
          </span>
        </div>
      ))}
    </>
  );
}

/* ── Pizza ───────────────────────────────────────────────────────────────── */
function PizzaSection({ value }: { value: Record<string, MenuItem[]> }) {
  const sizes      = Object.keys(value);
  const shortLabels = sizes.map(s => s.match(/large|medium/i)?.[0] ?? s);

  // Build { pizzaName: { sizeLabel: price } }
  const pizzaMap  = new Map<string, Record<string, number>>();
  const pizzaOrder: string[] = [];
  sizes.forEach(sizeLabel => {
    value[sizeLabel].forEach(item => {
      if (!pizzaMap.has(item.name)) {
        pizzaMap.set(item.name, {});
        pizzaOrder.push(item.name);
      }
      pizzaMap.get(item.name)![sizeLabel] = item.price;
    });
  });

  return (
    <>
      {pizzaOrder.map(pizzaName => (
        <div key={pizzaName} className="menu-item menu-item--multi">
          <span className="item-name">{pizzaName}</span>
          <span className="item-dots" />
          <div className="item-multi-right">
            <div className="item-multi-labels">
              {sizes.map((_, i) => (
                <span key={i} className="item-size-label">{shortLabels[i]}</span>
              ))}
            </div>
            <div className="item-multi-prices">
              {sizes.map((sizeLabel, i) => (
                <span key={i} className="item-price">
                  <span className="currency">Rs.</span>
                  {pizzaMap.get(pizzaName)?.[sizeLabel] ?? '—'}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Momo ────────────────────────────────────────────────────────────────── */
function MomoSection({ value }: { value: Record<string, MenuItem[]> }) {
  return (
    <>
      {Object.entries(value).map(([protein, items]) => {
        const varieties = items.map(item => ({
          label: item.name
            .replace(new RegExp(protein, 'i'), '')
            .replace(/momo/i, '')
            .trim(),
          price: item.price,
        }));

        return (
          <div key={protein}>
            <div className="momo-subheading">{protein}</div>
            <div className="menu-item menu-item--multi">
              <span className="item-name">{protein} Momo</span>
              <span className="item-dots" />
              <div className="item-multi-right">
                <div className="item-multi-labels">
                  {varieties.map((v, i) => (
                    <span key={i} className="item-size-label">{v.label}</span>
                  ))}
                </div>
                <div className="item-multi-prices">
                  {varieties.map((v, i) => (
                    <span key={i} className="item-price">
                      <span className="currency">Rs.</span>{v.price}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ── Combos ──────────────────────────────────────────────────────────────── */
const HIGHLIGHT = ['pizza', 'hukka', 'wings', 'sekuwa'];

function ComboSection({ value }: { value: Record<string, MenuItem[]> }) {
  return (
    <div className="combo-grid">
      {Object.entries(value).flatMap(([sub, items]) =>
        items.map((item, i) => {
          const servesMatch = item.name.match(/for\s+(\d+)/i);
          const servesText  = servesMatch ? `For ${servesMatch[1]}` : '';
          const parts       = item.name
            .replace(/\+\s*Choice of [Dd]rink for \d+/i, '')
            .replace(/\+\s*Popcorn\/Chiura/i, '+ Popcorn / Chiura')
            .split(/\s*\+\s*/)
            .map((p: string) => p.trim())
            .filter(Boolean) as string[];

          return (
            <div
              key={`${sub}-${i}`}
              className={`combo-card ${sub === 'Jumbo Combo' ? 'jumbo' : ''}`}
            >
              <h3 className="combo-size">{sub}</h3>
              <div className="combo-items">
                {parts.map((part: string, j: number) => (
                  <span
                    key={j}
                    className={`combo-pill ${
                      HIGHLIGHT.some(k => part.toLowerCase().includes(k))
                        ? 'highlight'
                        : ''
                    }`}
                  >
                    {part}
                  </span>
                ))}
              </div>
              <div className="combo-footer">
                <span className="combo-serves">{servesText}</span>
                <div className="combo-price">
                  <span className="currency">Rs.</span>{item.price}
                </div>
              </div>
            </div>
          );
        }),
      )}
    </div>
  );
}