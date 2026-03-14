import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const links = [
  { href: '/#tarihce', label: 'Tarihçe' },
  { href: '/finansal', label: 'Finansal' },
  { href: '/toplanti-notlari', label: 'Toplantılar' },
];

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full apple-blur bg-background-light/80 dark:bg-background-dark/80 border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-slate-100">apartment</span>
          <span className="text-base font-semibold tracking-tight">Cumhuriyet Apartmanı</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm font-medium hover:text-primary/70 transition-colors">
              {l.label}
            </a>
          ))}
          {isAuthenticated ? (
            <Link to="/dashboard" className="bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
              Dashboard
            </Link>
          ) : (
            <Link to="/giris" className="bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
              Giriş Yap
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-background-dark border-b border-primary/10 px-5 py-4 flex flex-col gap-3">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm font-medium py-2 border-b border-primary/5" onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
          {isAuthenticated ? (
            <Link to="/dashboard" className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold text-center" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
          ) : (
            <Link to="/giris" className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold text-center" onClick={() => setMenuOpen(false)}>
              Giriş Yap
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
