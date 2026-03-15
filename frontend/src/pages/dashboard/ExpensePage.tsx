import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { expensesApi } from '../../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);

interface Expense { id: number; title: string; description: string; amount: number; type: string; date: string; invoice_path: string | null; invoice_original_name: string | null; }

export default function ExpensePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [filter, setFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');
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
      setExpenses(r.data.expenses);
      setTotal(r.data.total);
      setTotalPages(r.data.totalPages);
    }).catch(() => {});
  };

  useEffect(() => { expensesApi.getSummary().then(r => setSummary(r.data)).catch(() => {}); }, []);
  useEffect(() => { fetchExpenses(); }, [filter, monthFilter, page]);

  const exportPDF = async () => {
    try {
      setExporting(true);
      const res = await expensesApi.getAll({ type: filter || undefined, month: monthFilter || undefined, limit: 10000 });
      const dataToExport = res.data.expenses;
      
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Cumhuriyet Apartmani Finansal Rapor', 14, 22);
      
      const tableData = dataToExport.map((exp: Expense) => [
        exp.title,
        new Date(exp.date).toLocaleDateString('tr-TR'),
        `${exp.type === 'income' ? '+' : '-'}${formatCurrency(exp.amount)}`,
        exp.description || '-'
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['Baslik', 'Tarih', 'Tutar', 'Aciklama']],
        body: tableData,
      });

      doc.save('Finansal_Rapor.pdf');
      toast.success('PDF başarıyla indirildi!');
    } catch { toast.error('PDF oluşturulurken hata!'); } finally { setExporting(false); }
  };

  const exportExcel = async () => {
    try {
      setExporting(true);
      const res = await expensesApi.getAll({ type: filter || undefined, month: monthFilter || undefined, limit: 10000 });
      const dataToExport = res.data.expenses.map((exp: Expense) => ({
        'Başlık': exp.title,
        'Tarih': new Date(exp.date).toLocaleDateString('tr-TR'),
        'Tutar': `${exp.type === 'income' ? '+' : '-'}${exp.amount}`,
        'Açıklama': exp.description || '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'FinansalRapor');
      XLSX.writeFile(workbook, 'Finansal_Rapor.xlsx');
      toast.success('Excel başarıyla indirildi!');
    } catch { toast.error('Excel oluşturulurken hata!'); } finally { setExporting(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.date) { toast.error('Başlık, tutar ve tarih zorunludur.'); return; }
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('invoice', file);
    try {
      await expensesApi.create(fd);
      toast.success('Kayıt eklendi!');
      setForm({ title: '', amount: '', date: '', description: '', type: 'expense' });
      setFile(null);
      expensesApi.getSummary().then(r => setSummary(r.data));
      fetchExpenses();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Hata.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      await expensesApi.delete(id);
      toast.success('Kayıt silindi.');
      fetchExpenses();
      expensesApi.getSummary().then(r => setSummary(r.data));
    } catch { toast.error('Silme başarısız.'); }
  };

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gelir / Gider Yönetimi</h1>
        <p className="text-slate-500 text-sm mt-1">Tüm finansal kayıtlar ve faturalar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200"><p className="text-xs text-slate-500 mb-1">Gelir</p><p className="text-xl font-bold text-emerald-600">{formatCurrency(summary.totalIncome)}</p></div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200"><p className="text-xs text-slate-500 mb-1">Gider</p><p className="text-xl font-bold text-red-500">{formatCurrency(summary.totalExpense)}</p></div>
        <div className="bg-primary text-white p-5 rounded-xl"><p className="text-xs opacity-70 mb-1">Net Bakiye</p><p className="text-xl font-bold">{formatCurrency(summary.balance)}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              {[['', 'Tümü'], ['expense', 'Giderler'], ['income', 'Gelirler']].map(([v, l]) => (
                <button key={v} onClick={() => { setFilter(v); setPage(1); }} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === v ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{l}</button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 focus-within:border-primary/50 transition-colors">
                <span className="text-xs text-slate-500 whitespace-nowrap">Tarih Filtresi:</span>
                <input 
                  type="month" 
                  value={monthFilter} 
                  onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}
                  className="bg-transparent text-sm focus:outline-none dark:text-slate-300 min-w-min"
                />
                {monthFilter && (
                  <button onClick={() => { setMonthFilter(''); setPage(1); }} className="text-slate-400 hover:text-red-500 ml-1">
                    <span className="material-symbols-outlined text-sm block">close</span>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={exportPDF} disabled={exporting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50">
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> PDF
                </button>
                <button onClick={exportExcel} disabled={exporting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50">
                  <span className="material-symbols-outlined text-[18px]">table_chart</span> Excel
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500">
                  <th className="px-4 py-3">Başlık</th>
                  <th className="px-4 py-3 hidden md:table-cell">Tarih</th>
                  <th className="px-4 py-3">Tutar</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                ) : expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-sm">{exp.title}</p>
                      {exp.description && <p className="text-xs text-slate-500">{exp.description}</p>}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-500 hidden md:table-cell">{new Date(exp.date).toLocaleDateString('tr-TR')}</td>
                    <td className="px-4 py-3.5">
                      <span className={`font-bold text-sm ${exp.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {exp.type === 'income' ? '+' : '-'}{formatCurrency(exp.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {exp.invoice_path && (
                          <button onClick={() => setPreviewUrl(`/uploads/${exp.invoice_path}`)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-primary hover:text-white transition-all" title="Faturayı Gör">
                            <span className="material-symbols-outlined text-base">visibility</span>
                          </button>
                        )}
                        <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-500 hover:text-white transition-all" title="Sil">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">Toplam {total} kayıt</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border text-xs disabled:opacity-40">Geri</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded border text-xs disabled:opacity-40">İleri</button>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold mb-4">Yeni Kayıt Ekle</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tür</label>
                <div className="flex gap-2">
                  {[['expense', 'Gider'], ['income', 'Gelir']].map(([v, l]) => (
                    <button type="button" key={v} onClick={() => setForm(f => ({ ...f, type: v }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.type === v ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Başlık" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Tutar (₺)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <textarea className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" rows={2} placeholder="Açıklama (opsiyonel)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${dragging ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0] || null); }}
                onClick={() => document.getElementById('file-input-2')?.click()}
              >
                <span className="material-symbols-outlined text-slate-400 text-2xl">upload_file</span>
                <p className="text-xs text-slate-500 mt-1">{file ? <span className="text-primary font-medium">{file.name}</span> : <>Fatura yükle (opsiyonel)</>}</p>
                <input id="file-input-2" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-60">
                {loading ? 'Kaydediliyor...' : 'Kayıt Ekle'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b"><h3 className="font-bold">Fatura</h3><button onClick={() => setPreviewUrl(null)}><span className="material-symbols-outlined">close</span></button></div>
            {previewUrl.endsWith('.pdf') ? <iframe src={previewUrl} className="w-full h-[70vh]" /> : <img src={previewUrl} alt="Fatura" className="w-full" />}
          </div>
        </div>
      )}
    </div>
  );
}
