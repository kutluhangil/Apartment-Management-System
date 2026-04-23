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

  const visibleItems = navItems.filter(item => {
    if (user?.role === 'sakin') {
      return ['/dashboard', '/dashboard/daireler', '/dashboard/duyurular', '/dashboard/belgeler'].includes(item.href);
    }
    return true;
  });

  const activeLabel = navItems.find(i =>
    i.exact ? location.pathname === i.href : location.pathname === i.href || location.pathname.startsWith(i.href + '/')
  )?.label || 'Genel Bakış';

  return (
    <div className="flex min-h-screen bg-[#fafaf9] text-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 h-screen w-64 border-r border-slate-200 bg-white flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-[#111] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-[18px]">apartment</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight truncate">Cumhuriyet Apt.</h1>
            <p className="text-[11px] text-slate-400 font-medium">Yönetim Paneli</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visibleItems.map(item => {
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
                    ? 'bg-[#111] text-white'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${active ? 'text-white' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 space-y-0.5">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-slate-400">open_in_new</span>
            Siteye Dön
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 sm:h-16 border-b border-slate-200 bg-white/90 apple-blur flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-slate-500">menu</span>
            </button>
            <span className="text-sm font-semibold text-slate-400 hidden sm:block">
              {activeLabel}
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{user.name || 'Kullanıcı'}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                  {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Yönetici' : 'Sakin'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#111] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
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
