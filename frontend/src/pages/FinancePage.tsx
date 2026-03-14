import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { expensesApi } from '../api';
import Navbar from '../components/public/Navbar';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

interface Expense {
  id: number;
  title: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  invoice_path: string | null;
}

const typeIcons: Record<string, string> = {
  'elektrik': 'electric_bolt',
  'su': 'water_drop',
  'asansör': 'elevator',
  'temizlik': 'cleaning_services',
  'bahçe': 'park',
  'boya': 'format_paint',
};

function getIcon(title: string) {
  for (const [key, icon] of Object.entries(typeIcons)) {
    if (title.toLowerCase().includes(key)) return icon;
  }
  return 'receipt_long';
}

const iconColors = ['bg-orange-100 text-orange-600', 'bg-blue-100 text-blue-600', 'bg-slate-100 text-slate-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600'];

export default function FinancePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    expensesApi.getSummary().then(r => setSummary(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    expensesApi.getAll({ type: 'expense', page, limit: 8 })
      .then(r => {
        setExpenses(r.data.expenses);
        setTotalPages(r.data.totalPages);
        setTotal(r.data.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="relative flex min-h-screen flex-col bg-background-light dark:bg-background-dark">
      <Navbar />

      <main className="flex-1 px-5 lg:px-16 py-10 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Finansal Şeffaflık</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">Apartmanımızın tüm gelir ve gider kayıtlarını gerçek zamanlı ve şeffaf bir şekilde takip edebilirsiniz.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 font-medium text-sm">Toplam Gelir</span>
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><span className="material-symbols-outlined text-lg">trending_up</span></div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalIncome)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 font-medium text-sm">Toplam Gider</span>
              <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><span className="material-symbols-outlined text-lg">trending_down</span></div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalExpense)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 font-medium text-sm">Mevcut Bakiye</span>
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><span className="material-symbols-outlined text-lg">account_balance_wallet</span></div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.balance)}</p>
            <p className="text-slate-500 text-xs mt-1">Gelecek ödemeler için hazır</p>
          </div>
        </div>

        {/* Table */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Gider Kayıtları</h2>
        </div>

        <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Gider Başlığı</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 hidden md:table-cell">Tarih</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Tutar</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Fatura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Yükleniyor...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Henüz gider kaydı yok.</td></tr>
              ) : expenses.map((exp, i) => (
                <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColors[i % iconColors.length]}`}>
                        <span className="material-symbols-outlined text-lg">{getIcon(exp.title)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{exp.title}</p>
                        {exp.description && <p className="text-xs text-slate-500">{exp.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 hidden md:table-cell">
                    {new Date(exp.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 font-bold text-sm">{formatCurrency(exp.amount)}</td>
                  <td className="px-5 py-4 text-right">
                    {exp.invoice_path ? (
                      <button
                        onClick={() => setPreviewUrl(`/uploads/${exp.invoice_path}`)}
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-primary hover:text-white transition-all"
                        title="Faturayı Gör"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm text-slate-500">Toplam {total} kayıt • sayfa {page}/{totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-slate-200 text-xs font-semibold disabled:opacity-40">Geri</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded border border-slate-200 text-xs font-semibold disabled:opacity-40">İleri</button>
            </div>
          </div>
        </div>

        {/* Transparency banner */}
        <div className="mt-10 relative overflow-hidden rounded-2xl bg-primary p-10 text-white">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Finansal Şeffaflık Raporu</h3>
              <p className="text-slate-300 max-w-xl text-sm">Her ay sonu detaylı bilanço ve denetim raporları tüm kat maliklerine iletilmektedir.</p>
            </div>
            <Link to="/toplanti-notlari" className="whitespace-nowrap rounded-lg bg-white text-primary px-6 py-3 font-bold hover:bg-slate-100 transition-colors text-sm">
              Toplantı Notlarına Git
            </Link>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/4 opacity-10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[120px]">verified_user</span>
          </div>
        </div>
      </main>

      {/* Invoice preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold">Fatura Önizleme</h3>
              <button onClick={() => setPreviewUrl(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {previewUrl.endsWith('.pdf') ? (
              <iframe src={previewUrl} className="w-full h-[70vh]" title="Fatura" />
            ) : (
              <img src={previewUrl} alt="Fatura" className="w-full" />
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-800 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-slate-500 text-sm">© {new Date().getFullYear()} Cumhuriyet Apartmanı Yönetimi</span>
          <div className="flex gap-5">
            <Link to="/" className="text-slate-500 hover:text-primary text-xs">Ana Sayfa</Link>
            <Link to="/toplanti-notlari" className="text-slate-500 hover:text-primary text-xs">Toplantılar</Link>
            <Link to="/giris" className="text-slate-500 hover:text-primary text-xs">Yönetici Girişi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
