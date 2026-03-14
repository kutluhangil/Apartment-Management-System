import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { aidatsApi, expensesApi } from '../../api';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);

const statusConfig = {
  paid: { label: 'Ödendi', cls: 'bg-green-100 text-green-800' },
  pending: { label: 'Beklemede', cls: 'bg-amber-100 text-amber-800' },
  unpaid: { label: 'Ödenmedi', cls: 'bg-red-100 text-red-800' },
};

interface Payment { id: number; apartment_number: number; owner_name: string; status: string; note: string; paid_at: string; }
interface Aidat { id: number; month: number; year: number; amount: number; }
interface Expense { id: number; title: string; date: string; amount: number; invoice_path: string | null; }

export default function AidatPage() {
  const [aidats, setAidats] = useState<Aidat[]>([]);
  const [selectedAidat, setSelectedAidat] = useState<Aidat | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({ paid_count: 0, pending_count: 0, unpaid_count: 0, total: 18, collected: 0 });
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [newPeriod, setNewPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: 1000 });
  const [addingPeriod, setAddingPeriod] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', date: '', description: '' });
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    aidatsApi.getAll().then(r => {
      setAidats(r.data);
      if (r.data.length > 0) selectAidat(r.data[0]);
    }).catch(() => {});
    expensesApi.getAll({ type: 'expense', limit: 5 }).then(r => setRecentExpenses(r.data.expenses)).catch(() => {});
  }, []);

  const selectAidat = (aidat: Aidat) => {
    setSelectedAidat(aidat);
    aidatsApi.getPayments(aidat.id).then(r => setPayments(r.data)).catch(() => {});
    aidatsApi.getStats(aidat.id).then(r => setStats(r.data)).catch(() => {});
  };

  const handleStatusChange = async (paymentId: number, status: string) => {
    try {
      await aidatsApi.updatePayment(paymentId, { status, paid_at: status === 'paid' ? new Date().toISOString() : '' });
      if (selectedAidat) {
        const r = await aidatsApi.getPayments(selectedAidat.id);
        setPayments(r.data);
        const s = await aidatsApi.getStats(selectedAidat.id);
        setStats(s.data);
      }
      toast.success('Durum güncellendi.');
    } catch { toast.error('Güncelleme başarısız.'); }
  };

  const handleCreatePeriod = async () => {
    try {
      await aidatsApi.create(newPeriod);
      toast.success('Aidat dönemi oluşturuldu!');
      const r = await aidatsApi.getAll();
      setAidats(r.data);
      if (r.data.length > 0) selectAidat(r.data[0]);
      setAddingPeriod(false);
    } catch (e: any) { toast.error(e.response?.data?.error || 'Hata oluştu.'); }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount || !expenseForm.date) { toast.error('Başlık, tutar ve tarih zorunludur.'); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append('title', expenseForm.title);
    fd.append('amount', expenseForm.amount);
    fd.append('date', expenseForm.date);
    fd.append('description', expenseForm.description);
    if (file) fd.append('invoice', file);
    try {
      await expensesApi.create(fd);
      toast.success('Gider kaydedildi!');
      setExpenseForm({ title: '', amount: '', date: '', description: '' });
      setFile(null);
      const r = await expensesApi.getAll({ type: 'expense', limit: 5 });
      setRecentExpenses(r.data.expenses);
    } catch (e: any) { toast.error(e.response?.data?.error || 'Kayıt başarısız.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Aidat & Finans Yönetimi</h1>
          {selectedAidat && <p className="text-slate-500">{MONTHS[selectedAidat.month - 1]} {selectedAidat.year} Dönemi</p>}
        </div>
        <button onClick={() => setAddingPeriod(!addingPeriod)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 self-start">
          <span className="material-symbols-outlined text-lg">add</span> Yeni Dönem
        </button>
      </div>

      {/* New period form */}
      {addingPeriod && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="font-bold mb-4">Yeni Aidat Dönemi Oluştur</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ay</label>
              <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={newPeriod.month} onChange={e => setNewPeriod(p => ({ ...p, month: +e.target.value }))}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Yıl</label>
              <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={newPeriod.year} onChange={e => setNewPeriod(p => ({ ...p, year: +e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tutar (₺)</label>
              <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={newPeriod.amount} onChange={e => setNewPeriod(p => ({ ...p, amount: +e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreatePeriod} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold">Oluştur</button>
            <button onClick={() => setAddingPeriod(false)} className="px-4 py-2 rounded-lg text-sm border border-slate-200">İptal</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200"><p className="text-xs text-slate-500 mb-1">Beklenen</p><p className="text-xl font-bold">{formatCurrency(stats.total * (selectedAidat?.amount || 1000))}</p></div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200"><p className="text-xs text-slate-500 mb-1">Tahsil Edilen</p><p className="text-xl font-bold text-green-600">{formatCurrency(stats.collected)}</p></div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200"><p className="text-xs text-slate-500 mb-1">Ödenmemiş</p><p className="text-xl font-bold text-red-500">{stats.unpaid_count}</p></div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200"><p className="text-xs text-slate-500 mb-1">Beklemede</p><p className="text-xl font-bold text-amber-600">{stats.pending_count}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Aidat table */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 items-center justify-between">
            <h3 className="font-bold">Aidat Durumları (18 Daire)</h3>
            <div className="flex flex-wrap gap-1">
              {aidats.slice(0, 6).map(a => (
                <button key={a.id} onClick={() => selectAidat(a)}
                  className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${selectedAidat?.id === a.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {MONTHS[a.month - 1]} {a.year}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500">
                  <th className="px-5 py-3">Daire No</th>
                  <th className="px-5 py-3">Sakin</th>
                  <th className="px-5 py-3 hidden md:table-cell">Tutar</th>
                  <th className="px-5 py-3 text-center">Durum</th>
                  <th className="px-5 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map(p => {
                  const s = statusConfig[p.status as keyof typeof statusConfig] || statusConfig.unpaid;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="px-5 py-3.5 font-medium text-sm">Daire {p.apartment_number}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{p.owner_name}</td>
                      <td className="px-5 py-3.5 hidden md:table-cell text-sm">{formatCurrency(selectedAidat?.amount || 1000)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={p.status}
                          onChange={e => handleStatusChange(p.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded py-1 px-2 bg-white dark:bg-slate-800"
                        >
                          <option value="paid">Ödendi</option>
                          <option value="pending">Beklemede</option>
                          <option value="unpaid">Ödenmedi</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: expense form + recent */}
        <div className="lg:col-span-4 space-y-5">
          {/* Expense form */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold mb-4">Gider Kaydet</h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Gider Başlığı</label>
                <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Örn: Asansör Bakımı" value={expenseForm.title} onChange={e => setExpenseForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tutar (₺)</label>
                  <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="0" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tarih</label>
                  <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              {/* File drop */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fatura Yükle (PDF/JPG/PNG)</label>
                <div
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${dragging ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'}`}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <span className="material-symbols-outlined text-slate-400 text-3xl mb-1">upload_file</span>
                  <p className="text-xs text-slate-500">
                    {file ? <span className="text-primary font-medium">{file.name}</span> : <>Sürükleyin veya <span className="text-primary font-bold">seçin</span></>}
                  </p>
                  <input id="file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60">
                {loading ? <><span className="material-symbols-outlined animate-spin text-base">refresh</span> Kaydediliyor...</> : 'Gider Ekle'}
              </button>
            </form>
          </div>

          {/* Recent expenses */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold mb-4">Son Giderler</h3>
            <div className="space-y-3">
              {recentExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{exp.title}</p>
                    <p className="text-xs text-slate-500">{new Date(exp.date).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-500">-{new Intl.NumberFormat('tr-TR').format(exp.amount)} ₺</p>
                    {exp.invoice_path && (
                      <button onClick={() => setPreviewUrl(`/uploads/${exp.invoice_path}`)} className="text-[10px] text-primary flex items-center gap-1 justify-end">
                        <span className="material-symbols-outlined text-xs">visibility</span> Fatura
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold">Fatura</h3>
              <button onClick={() => setPreviewUrl(null)}><span className="material-symbols-outlined">close</span></button>
            </div>
            {previewUrl.endsWith('.pdf') ? <iframe src={previewUrl} className="w-full h-[70vh]" /> : <img src={previewUrl} alt="Fatura" className="w-full" />}
          </div>
        </div>
      )}
    </div>
  );
}
