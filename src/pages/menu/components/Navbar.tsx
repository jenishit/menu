import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

interface NavbarProps {
  categories: string[];
}

function toCategoryId(name: string) {
  return `cat-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
}

export default function Navbar({ categories }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const navRef   = useRef<HTMLElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    function measure() {
      const h = navRef.current?.offsetHeight ?? 0;
      if (spacerRef.current) spacerRef.current.style.height = `${h}px`;
      setScrolled(window.scrollY > h * 0.4);
    }
    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <>
      <header ref={navRef} className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <img src="/Light-Logo.png" alt="Aago Aroma" className="nav-logo" />
        <div className="nav-content">
          <div className="nav-title">
            <div className="flame-bar">
              <span /><span />
            </div>
            <h1><em>Aago</em> Aroma</h1>
            <p className="tagline">Where Fire Crafts Flavor</p>
          </div>

          {categories.length > 0 && (
            <nav className="nav-links" aria-label="Menu sections">
              {categories.map(category => (
                <a key={category} href={`#${toCategoryId(category)}`} className="nav-link">
                  {category}
                </a>
              ))}
            </nav>
          )}

          <div className="nav-auth-row">
            <Link to={user ? '/admin' : '/login'} className="nav-cta">
              {user ? 'Admin Panel' : 'Login'}
            </Link>
          </div>
        </div>
      </header>
      <div ref={spacerRef} />
    </>
  );
}