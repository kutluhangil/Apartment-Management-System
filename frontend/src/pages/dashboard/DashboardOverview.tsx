import { useState, useEffect } from 'react';
import { expensesApi, apartmentsApi, analyticsApi, meetingsApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../../utils/format';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

const darkTooltip = {
  backgroundColor: '#18181b',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  color: 'white',
  fontSize: '12px',
};

export default function DashboardOverview() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [apartments, setApartments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [lastMeeting, setLastMeeting] = useState<any>(null);

  useEffect(() => {
    expensesApi.getSummary().then(r => setSummary(r.data)).catch(() => {});
    apartmentsApi.getAll().then(r => setApartments(r.data)).catch(() => {});
    analyticsApi.getDashboardStats().then(r => setAnalytics(r.data)).catch(() => {});
    meetingsApi.getAll({ page: 1 }).then(r => {
      if (r.data.meetings?.length > 0) setLastMeeting(r.data.meetings[0]);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">
          Hoş geldiniz, {user?.name ? user.name.split(' ')[0] : ''} 👋
        </h1>
        <p className="text-white/40 mt-1 text-sm">Cumhuriyet Apartmanı yönetim paneli özeti</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-zinc-900 border border-white/[0.07] p-5 rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">Toplam Daire</p>
          <p className="text-2xl font-black text-white">{apartments.length || 18}</p>
        </div>
        <div className="bg-zinc-900 border border-white/[0.07] p-5 rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">Ödedi (Bu Ay)</p>
          <p className="text-2xl font-black text-emerald-400">{analytics?.paidCount || 0}</p>
        </div>
        <div className="bg-zinc-900 border border-white/[0.07] p-5 rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">Borçlu</p>
          <p className="text-2xl font-black text-rose-400">{18 - (analytics?.paidCount || 0)}</p>
        </div>
        <div className="bg-zinc-900 border border-white/[0.07] p-5 rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">Son Toplantı</p>
          <p className="text-lg font-black text-white">{lastMeeting ? new Date(lastMeeting.date).toLocaleDateString('tr-TR') : '—'}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 p-5 rounded-2xl shadow-lg shadow-indigo-500/20 col-span-2 lg:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-2">Net Bakiye</p>
          <p className="text-2xl font-black text-white">{formatCurrency(summary.balance)}</p>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bar Chart */}
        <div className="lg:col-span-8 bg-zinc-900 border border-white/[0.07] p-6 rounded-2xl">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-[18px]">bar_chart</span>
            Finansal Analiz (Aylık)
          </h2>
          <div className="h-64">
            {analytics?.monthlyData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={darkTooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend iconType="circle" wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }} />
                  <Bar dataKey="income" name="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="expense" name="Gider" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/30 text-sm">Yükleniyor...</div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-5">
          {/* Pie chart */}
          <div className="bg-zinc-900 border border-white/[0.07] p-6 rounded-2xl">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-4">Gider Dağılımı</h2>
            <div className="h-40">
              {analytics?.expenseDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.expenseDistribution} cx="50%" cy="50%" innerRadius={42} outerRadius={60} paddingAngle={3} dataKey="value">
                      {analytics.expenseDistribution.map((_e: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={darkTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-white/30 text-xs">Veri yok</div>
              )}
            </div>
            <div className="mt-3 space-y-1.5">
              {analytics?.expenseDistribution?.slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-white/60 truncate max-w-[110px]">{item.category}</span>
                  </div>
                  <span className="text-white font-bold">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment rate */}
          <div className="bg-zinc-900 border border-white/[0.07] p-6 rounded-2xl">
            <div className="flex justify-between items-end mb-3">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-white/40">Aidat Tahsil Oranı</h2>
              <span className="text-2xl font-black text-white">{analytics?.paymentRate || 0}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-700"
                style={{ width: `${analytics?.paymentRate || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/40">
              <span>Ödenen: <span className="text-emerald-400 font-bold">{analytics?.paidCount || 0}</span></span>
              <span>Bekleyen: <span className="text-rose-400 font-bold">{18 - (analytics?.paidCount || 0)}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-white/[0.07] p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-emerald-400 text-xl">trending_up</span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Toplam Gelir</p>
            <p className="text-lg font-black text-emerald-400">{formatCurrency(summary.totalIncome)}</p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-white/[0.07] p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-rose-400 text-xl">trending_down</span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Toplam Gider</p>
            <p className="text-lg font-black text-rose-400">{formatCurrency(summary.totalExpense)}</p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-white/[0.07] p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-indigo-400 text-xl">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Net Bakiye</p>
            <p className="text-lg font-black text-white">{formatCurrency(summary.balance)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
