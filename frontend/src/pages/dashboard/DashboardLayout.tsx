import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard', label: 'Panel Özeti', icon: 'dashboard', exact: true },
  { href: '/dashboard/aidat', label: 'Aidat Yönetimi', icon: 'payments' },
  { href: '/dashboard/gelir-gider', label: 'Gelir / Gider', icon: 'account_balance_wallet' },
  { href: '/dashboard/toplanti', label: 'Toplantı Yönetimi', icon: 'calendar_today' },
  { href: '/dashboard/daireler', label: 'Daire Listesi', icon: 'domain' },
  { href: '/dashboard/duyurular', label: 'Duyurular', icon: 'campaign' },
  { href: '/dashboard/belgeler', label: 'Belgeler Arşivi', icon: 'folder_open' },
  { href: '/dashboard/bakim', label: 'Bakım Takibi', icon: 'handyman' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme') === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleLogout = () => {
    logout();
    toast.success('Çıkış yapıldı.');
    navigate('/giris', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed md:sticky top-0 h-screen w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">apartment</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight truncate">Cumhuriyet Apt.</h1>
            <p className="text-xs text-slate-500">Yönetim</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.filter(item => {
            if (user?.role === 'sakin') {
              return ['/dashboard', '/dashboard/daireler', '/dashboard/duyurular', '/dashboard/belgeler'].includes(item.href);
            }
            return true;
          }).map(item => {
            const active = item.exact
              ? location.pathname === item.href
              : location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${active ? '' : 'opacity-80'}`}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-[20px]">open_in_new</span>
            Siteye Dön
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Çıkış Yap
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-5 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-sm font-bold tracking-tight hidden sm:block opacity-70">Yönetim Paneli / {navItems.find(i => location.pathname === i.href || (!i.exact && location.pathname.startsWith(i.href + '/')))?.label || 'Genel Bakış'}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="hidden sm:block">{isDark ? 'Light' : 'Dark'}</span>
            </button>

            {user && (
              <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold leading-none">{user?.name || 'Kullanıcı'}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">{user?.role === 'admin' ? 'Yönetici Admin' : 'Sakin'}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shadow-sm font-bold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-2 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
