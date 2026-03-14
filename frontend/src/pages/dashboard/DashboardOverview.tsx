import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { expensesApi, aidatsApi, apartmentsApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);

export default function DashboardOverview() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [apartments, setApartments] = useState<any[]>([]);

  useEffect(() => {
    expensesApi.getSummary().then(r => setSummary(r.data)).catch(() => {});
    apartmentsApi.getAll().then(r => setApartments(r.data)).catch(() => {});
  }, []);

  const quickLinks = [
    { href: '/dashboard/aidat', icon: 'payments', label: 'Aidat Yönetimi', desc: '18 daire takibi' },
    { href: '/dashboard/gelir-gider', icon: 'account_balance_wallet', label: 'Gelir / Gider', desc: 'Fatura ve kayıtlar' },
    { href: '/dashboard/toplanti', icon: 'calendar_today', label: 'Toplantı Yönetimi', desc: 'Toplantı oluştur' },
    { href: '/dashboard/daireler', icon: 'domain', label: 'Daire Listesi', desc: '18 daire bilgisi' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Hoş geldiniz, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 mt-1">Cumhuriyet Apartmanı yönetim paneli özeti</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 mb-2">Toplam Gelir</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalIncome)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 mb-2">Toplam Gider</p>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(summary.totalExpense)}</p>
        </div>
        <div className="bg-primary text-white p-6 rounded-xl">
          <p className="text-sm opacity-80 mb-2">Net Bakiye</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.balance)}</p>
          <p className="text-xs opacity-60 mt-1 uppercase tracking-widest">Kasada</p>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-bold mb-4">Hızlı Erişim</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map(ql => (
            <Link key={ql.href} to={ql.href} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-md hover:-translate-y-1 transition-all group">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-primary group-hover:text-white">{ql.icon}</span>
              </div>
              <h3 className="font-semibold text-sm mb-1">{ql.label}</h3>
              <p className="text-xs text-slate-500">{ql.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Apartments quick view */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Daire Listesi</h2>
          <Link to="/dashboard/daireler" className="text-sm text-primary font-medium hover:underline">Tümünü Gör</Link>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {apartments.slice(0, 8).map(apt => (
            <div key={apt.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                {String(apt.number).padStart(2, '0')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{apt.owner_name}</p>
                <p className="text-xs text-slate-500">Kat {apt.floor} · Daire {apt.number}</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
            </div>
          ))}
          {apartments.length > 8 && (
            <div className="px-5 py-3 text-center">
              <Link to="/dashboard/daireler" className="text-sm text-primary hover:underline">+{apartments.length - 8} daire daha göster</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
