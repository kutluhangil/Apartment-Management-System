import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { expensesApi } from '../../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency } from '../../utils/format';
import InvoicePreviewModal from '../../components/ui/InvoicePreviewModal';

interface Expense { id: number; title: string; description: string; amount: number; type: string; date: string; invoice_path: string | null; invoice_original_name: string | null; }

const card = "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/[0.07]";
const inp = "w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400/30 transition-all";
const lbl = "block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-2";

export default function ExpensePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [filter, setFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', amount: '', date: '', description: '', type: 'expense' });
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchExpenses = () => {
    expensesApi.getAll({ type: filter || undefined, month: monthFilter || undefined, page, limit: 10 }).then(r => {
      setExpenses(r.data.expenses); setTotal(r.data.total); setTotalPages(r.data.totalPages);
    }).catch(() => {});
  };

  useEffect(() => { expensesApi.getSummary().then(r => setSummary(r.data)).catch(() => {}); }, []);
  useEffect(() => { fetchExpenses(); }, [filter, monthFilter, page]);

  const exportPDF = async () => {
    try {
      setExporting(true);
      const res = await expensesApi.getAll({ type: filter || undefined, month: monthFilter || undefined, limit: 10000 });
      const doc = new jsPDF();
      doc.setFontSize(18); doc.text('Cumhuriyet Apartmani Finansal Rapor', 14, 22);
      autoTable(doc, {
        startY: 30,
        head: [['Baslik', 'Tarih', 'Tutar', 'Aciklama']],
        body: res.data.expenses.map((e: Expense) => [e.title, new Date(e.date).toLocaleDateString('tr-TR'), `${e.type === 'income' ? '+' : '-'}${formatCurrency(e.amount)}`, e.description || '-']),
      });
      doc.save('Finansal_Rapor.pdf');
      toast.success('PDF indirildi!');
    } catch { toast.error('PDF oluşturulamadı!'); } finally { setExporting(false); }
  };

  const exportExcel = async () => {
    try {
      setExporting(true);
      const res = await expensesApi.getAll({ type: filter || undefined, month: monthFilter || undefined, limit: 10000 });
      const ws = XLSX.utils.json_to_sheet(res.data.expenses.map((e: Expense) => ({
        'Başlık': e.title, 'Tarih': new Date(e.date).toLocaleDateString('tr-TR'),
        'Tutar': `${e.type === 'income' ? '+' : '-'}${e.amount}`, 'Açıklama': e.description || '-',
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Finansal');
      XLSX.writeFile(wb, 'Finansal_Rapor.xlsx');
      toast.success('Excel indirildi!');
    } catch { toast.error('Excel oluşturulamadı!'); } finally { setExporting(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.date) return toast.error('Başlık, tutar ve tarih zorunludur.');
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('invoice', file);
    try {
      await expensesApi.create(fd);
      toast.success('Kayıt eklendi!');
      setForm({ title: '', amount: '', date: '', description: '', type: 'expense' }); setFile(null);
      expensesApi.getSummary().then(r => setSummary(r.data));
      fetchExpenses();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Hata.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      await expensesApi.delete(id); toast.success('Silindi.');
      fetchExpenses(); expensesApi.getSummary().then(r => setSummary(r.data));
    } catch { toast.error('Silme başarısız.'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Gelir / Gider</h1>
        <p className="text-gray-400 dark:text-white/40 text-sm mt-1">Tüm finansal kayıtlar ve faturalar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`${card} p-5 rounded-2xl flex items-center gap-4`}>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl">trending_up</span>
          </div>
          <div>
            <p className={lbl}>Gelir</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.totalIncome)}</p>
          </div>
        </div>
        <div className={`${card} p-5 rounded-2xl flex items-center gap-4`}>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/15 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-xl">trending_down</span>
          </div>
          <div>
            <p className={lbl}>Gider</p>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400">{formatCurrency(summary.totalExpense)}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 p-5 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-xl">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1">Net Bakiye</p>
            <p className="text-xl font-black text-white">{formatCurrency(summary.balance)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Table side */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-2">
              {[['', 'Tümü'], ['expense', 'Giderler'], ['income', 'Gelirler']].map(([v, l]) => (
                <button key={v} onClick={() => { setFilter(v); setPage(1); }}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    filter === v
                      ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
                      : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                  }`}>{l}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 focus-within:border-indigo-500/30 transition-all">
                <span className="text-xs text-gray-400 dark:text-white/40 whitespace-nowrap">Tarih:</span>
                <input type="month" value={monthFilter} onChange={e => { setMonthFilter(e.target.value); setPage(1); }}
                  className="bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none min-w-min" />
                {monthFilter && (
                  <button onClick={() => { setMonthFilter(''); setPage(1); }} className="text-gray-400 dark:text-white/40 hover:text-rose-500 ml-1 transition-colors">
                    <span className="material-symbols-outlined text-sm block">close</span>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={exportPDF} disabled={exporting} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all disabled:opacity-40">
                  <span className="material-symbols-outlined text-[17px]">picture_as_pdf</span> PDF
                </button>
                <button onClick={exportExcel} disabled={exporting} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all disabled:opacity-40">
                  <span className="material-symbols-outlined text-[17px]">table_chart</span> Excel
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className={`${card} rounded-2xl overflow-hidden`}>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/[0.03] text-[11px] uppercase tracking-wider text-gray-400 dark:text-white/40">
                  <th className="px-5 py-3">Başlık</th>
                  <th className="px-5 py-3 hidden md:table-cell">Tarih</th>
                  <th className="px-5 py-3">Tutar</th>
                  <th className="px-5 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {expenses.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400 dark:text-white/30 text-sm">Kayıt bulunamadı.</td></tr>
                ) : expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{exp.title}</p>
                      {exp.description && <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{exp.description}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 dark:text-white/40 hidden md:table-cell">
                      {new Date(exp.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-black text-sm ${exp.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {exp.type === 'income' ? '+' : '−'}{formatCurrency(exp.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {exp.invoice_path && (
                          <button onClick={() => setPreviewUrl(`/uploads/${exp.invoice_path}`)}
                            className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-300 text-gray-400 dark:text-white/40 transition-all" title="Faturayı Gör">
                            <span className="material-symbols-outlined text-base">visibility</span>
                          </button>
                        )}
                        <button onClick={() => handleDelete(exp.id)}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300 text-gray-400 dark:text-white/40 transition-all" title="Sil">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
              <p className="text-xs text-gray-400 dark:text-white/30">Toplam {total} kayıt</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-500 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-all">Geri</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-500 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-all">İleri</button>
              </div>
            </div>
          </div>
        </div>

        {/* Form side */}
        <div className="lg:col-span-4">
          <div className={`${card} p-5 rounded-2xl`}>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-5">Yeni Kayıt Ekle</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className={lbl}>Tür</label>
                <div className="flex gap-2">
                  {[['expense', 'Gider'], ['income', 'Gelir']].map(([v, l]) => (
                    <button type="button" key={v} onClick={() => setForm(f => ({ ...f, type: v }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        form.type === v
                          ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
                          : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                      }`}>{l}</button>
                  ))}
                </div>
              </div>
              <input className={inp} placeholder="Başlık" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className={inp} placeholder="Tutar (₺)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                <input type="date" className={inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <textarea className={`${inp} resize-none`} rows={2} placeholder="Açıklama (opsiyonel)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${dragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0] || null); }}
                onClick={() => document.getElementById('efile-input')?.click()}
              >
                <span className="material-symbols-outlined text-gray-300 dark:text-white/30 text-2xl">upload_file</span>
                <p className="text-xs text-gray-400 dark:text-white/40 mt-1">{file ? <span className="text-indigo-600 dark:text-indigo-400 font-medium">{file.name}</span> : 'Fatura yükle (opsiyonel)'}</p>
                <input id="efile-input" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                {loading ? 'Kaydediliyor...' : 'Kayıt Ekle'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {previewUrl && <InvoicePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
    </div>
  );
}
