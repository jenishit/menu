import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import CategorySection from './components/CategoryBlock';
import { useMenu } from '../../hooks/useMenu';

export default function MenuPage() {
  const { menu, loading, error } = useMenu();
  const categories = menu ? Object.keys(menu) : [];

  return (
    <div className="grain-overlay glow-overlay min-h-screen">
      <Navbar categories={categories} />

      {/* Hero divider */}
      <div className="flex justify-center h-[200px]">
        <div className="w-px h-[60px] bg-gradient-to-b from-transparent via-gold to-transparent animate-fade-up" />
      </div>

      {/* Menu content */}
      <main
        className="relative z-10 max-w-[780px] mx-auto px-6 pb-32 min-h-[60vh]"
      >
        {loading && (
          <p className="text-center text-muted text-sm tracking-widest uppercase mt-20 animate-pulse">
            Loading menu…
          </p>
        )}
        {error && (
          <p className="text-center text-ember text-sm tracking-wide mt-20">
            {error}
          </p>
        )}
        {menu &&
          Object.entries(menu).map(([catName, catValue], idx) => (
            <CategorySection
              key={catName}
              id={`cat-${catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
              name={catName}
              index={idx + 1}
              value={catValue}
            />
          ))}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-10 border-t border-gold/10">
        <p className="text-xs tracking-widest uppercase text-muted">
          Aago Aroma &nbsp;·&nbsp; All prices in NPR &nbsp;·&nbsp; Subject to change
        </p>
        <Link
          to="/login"
          className="inline-block mt-4 text-[10px] tracking-[0.25em] uppercase
                     text-muted/30 hover:text-muted transition-colors duration-300"
        >
          Admin
        </Link>
      </footer>
    </div>
  );
}