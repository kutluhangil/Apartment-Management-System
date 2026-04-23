import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const links = [
  { href: '/#tarihce', label: 'Tarihçe' },
  { href: '/finansal', label: 'Finansal' },
  { href: '/toplanti-notlari', label: 'Toplantılar' },
];

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full apple-blur bg-[#fafaf9]/90 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#111]">apartment</span>
          <span className="text-sm font-bold tracking-tight text-[#111]">Cumhuriyet Apartmanı</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-slate-500 hover:text-[#111] transition-colors">
              {l.label}
            </a>
          ))}
          {isAuthenticated ? (
            <Link to="/dashboard" className="bg-[#111] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#333] transition-colors">
              Dashboard
            </Link>
          ) : (
            <Link to="/giris" className="bg-[#111] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#333] transition-colors">
              Giriş Yap
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="material-symbols-outlined text-[#111]">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#fafaf9] border-b border-slate-200 px-5 py-4 flex flex-col gap-2">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium py-2.5 px-3 rounded-xl hover:bg-slate-100 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}
          {isAuthenticated ? (
            <Link to="/dashboard" className="mt-2 bg-[#111] text-white px-5 py-3 rounded-xl text-sm font-semibold text-center" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
          ) : (
            <Link to="/giris" className="mt-2 bg-[#111] text-white px-5 py-3 rounded-xl text-sm font-semibold text-center" onClick={() => setMenuOpen(false)}>
              Giriş Yap
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
