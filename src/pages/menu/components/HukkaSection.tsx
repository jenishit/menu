import type { CategoryValue } from '../../../types';

interface Props {
  id: string;
  name: string;
  index: number;
  value: CategoryValue;
}

// ── Hukka data (hardcoded to match the sheesha menu design) ────────────────
const SHEESHA_ITEMS = [
  {
    name: 'Regular Sheesha',
    price: 'Rs. 500/-',
    description:
      'Served with regular chillum with coconut coil, and a variety of Aago Aroma special flavors.',
  },
  {
    name: 'Chilled Sheesha',
    price: 'Rs. 700/- (Launching soon)',
    description:
      'Served with iced chillum with added fruits (watermelon, pineapple etc) coconut coil, ice pipe, and diverse Aago Aroma special flavours.',
  },
  {
    name: 'Aago Aromaa Premium Sheesha',
    price: 'Rs. 999/-',
    description:
      'Served with matching fruit-based chillum to its alternate flavors (pineapple, watermelon/ tea flavors/ crushed ice/ mint/ etc.) with crushed ice, coconut coil, iced pipe, and a range of special single/mix of any available flavors with free change of the coil.',
  },
];

const FLAVOURS_LEFT = [
  'Iced Melon',
  'Mint',
  'Double Melon',
  'Gypsy',
];

const FLAVOURS_RIGHT = [
  'Lady Killer',
  'Paan',
  'And Many More',
  
];

export default function HukkaSection({ id, name, index, value }: Props) {
  // We still receive the Firestore data via `value` but render with the custom layout.
  // If you want dynamic items, you can map from `value` instead of the hardcoded arrays.

  return (
    <div id={id} className="hukka-section">
      {/* Hookah image floating on the left */}
      <div className="hukka-hookah-img">
        <img src="/hookka.png" alt="Sheesha hookah" className='w-full h-full'/>
      </div>

      {/* Content area */}
      <div className="hukka-content">
        <h2 className="hukka-title">Sheesha Menu</h2>
        
        {/* Product listings */}
        <div className="hukka-products">
          {SHEESHA_ITEMS.map((item, i) => (
            <div key={i} className="hukka-product">
              <h3 className="hukka-product-name">
                {item.name} <span className="hukka-product-divider">|</span>{' '}
                <span className="hukka-product-price">{item.price}</span>
              </h3>
              <p className="hukka-product-desc">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Flavours */}
        <div className="hukka-flavours">
          <h3 className="hukka-flavours-title">Flavours</h3>
          <div className="hukka-flavours-grid">
            <ul className="hukka-flavour-list">
              {FLAVOURS_LEFT.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <ul className="hukka-flavour-list">
              {FLAVOURS_RIGHT.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tagline */}
        <p className="hukka-tagline">
          Undoubtedly the finest sheesha experience you'll find in town.
        </p>
      </div>
    </div>
  );
}
