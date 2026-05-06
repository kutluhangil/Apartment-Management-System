import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard',              label: 'Panel Özeti',       icon: 'dashboard',              exact: true },
  { href: '/dashboard/aidat',        label: 'Aidat Yönetimi',    icon: 'payments' },
  { href: '/dashboard/gelir-gider',  label: 'Gelir / Gider',     icon: 'account_balance_wallet' },
  { href: '/dashboard/toplanti',     label: 'Toplantı Yönetimi', icon: 'calendar_today' },
  { href: '/dashboard/daireler',     label: 'Daire Listesi',     icon: 'domain' },
  { href: '/dashboard/duyurular',    label: 'Duyurular',         icon: 'campaign' },
  { href: '/dashboard/belgeler',     label: 'Belgeler Arşivi',   icon: 'folder_open' },
  { href: '/dashboard/bakim',        label: 'Bakım Takibi',      icon: 'handyman' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Çıkış yapıldı.');
    navigate('/giris', { replace: true });
  };

  const activeLabel = navItems.find(i =>
    i.exact ? location.pathname === i.href : location.pathname === i.href || location.pathname.startsWith(i.href + '/')
  )?.label || 'Panel';

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 h-screen w-64 border-r border-white/[0.07] bg-zinc-900 flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-white/[0.07]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
            <span className="material-symbols-outlined text-white text-[18px]">apartment</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-[13px] font-bold leading-tight truncate text-white">Cumhuriyet Apt.</h1>
            <p className="text-[11px] text-white/40 font-medium">Yönetim Paneli</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = item.exact
              ? location.pathname === item.href
              : location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-indigo-500/15 text-indigo-200'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${active ? 'text-indigo-300' : 'text-white/30'}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.07] space-y-0.5">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:bg-white/5 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-[20px] text-white/30">open_in_new</span>
            Siteye Dön
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 sm:h-16 border-b border-white/[0.07] bg-zinc-950/80 apple-blur flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-white/60">menu</span>
            </button>
            <span className="text-sm font-semibold text-white/40 hidden sm:block tracking-wide">
              {activeLabel}
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none text-white">{user.name || 'Kullanıcı'}</p>
                <p className="text-[11px] text-white/40 font-medium mt-0.5 uppercase tracking-wider">
                  {user.role === 'admin' ? 'Admin' : 'Yönetici'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md shadow-indigo-500/30">
                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
              </div>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
