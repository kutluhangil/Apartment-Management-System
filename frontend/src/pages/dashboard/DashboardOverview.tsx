import { useState, useEffect } from 'react';
// Link removed if unused
import { expensesApi, apartmentsApi, analyticsApi, meetingsApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

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
      if (r.data.meetings && r.data.meetings.length > 0) {
        setLastMeeting(r.data.meetings[0]);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Hoş geldiniz, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 mt-1">Cumhuriyet Apartmanı yönetim paneli özeti</p>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
          <p className="text-xs text-slate-500 mb-1">Toplam Daire</p>
          <p className="text-2xl font-bold">{apartments.length || 18}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
          <p className="text-xs text-slate-500 mb-1">Aidat Ödeyen (Bu Ay)</p>
          <p className="text-2xl font-bold text-emerald-600">{analytics?.paidCount || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
          <p className="text-xs text-slate-500 mb-1">Aidat Borcu Olan</p>
          <p className="text-2xl font-bold text-red-500">{18 - (analytics?.paidCount || 0)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
          <p className="text-xs text-slate-500 mb-1">Son Toplantı</p>
          <p className="text-lg font-bold">{lastMeeting ? new Date(lastMeeting.date).toLocaleDateString('tr-TR') : 'Yok'}</p>
        </div>
        <div className="bg-primary text-white p-5 rounded-xl flex flex-col justify-center">
          <p className="text-xs opacity-80 mb-1">Net Bakiye</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.balance)}</p>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Income vs Expense Bar Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold mb-6">Finansal Analiz (Aylık)</h2>
          <div className="h-72">
            {analytics?.monthlyData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} cursor={{ fill: 'transparent' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="income" name="Gelir" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="expense" name="Gider" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">Yükleniyor...</div>
            )}
          </div>
        </div>

        {/* Expense Pie Chart + Payment Rate */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-500 mb-4">Gider Dağılımı</h2>
            <div className="h-48">
              {analytics?.expenseDistribution && analytics.expenseDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.expenseDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                      {analytics.expenseDistribution.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">Veri yok</div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {analytics?.expenseDistribution?.slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="truncate max-w-[120px]">{item.category}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Aidat Payment Rate Progress */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-end mb-2">
              <h2 className="text-sm font-bold text-slate-500">Aidat Tahsil Oranı</h2>
              <span className="text-xl font-black">{analytics?.paymentRate || 0}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-4 overflow-hidden">
              <div className="bg-primary h-3 rounded-full transition-all duration-1000" style={{ width: `${analytics?.paymentRate || 0}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Ödenen: {analytics?.paidCount || 0} daire</span>
              <span>Bekleyen: {18 - (analytics?.paidCount || 0)} daire</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
