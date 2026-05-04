import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { aidatsApi, expensesApi } from '../../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { MONTHS, formatCurrency } from '../../utils/format';
import InvoicePreviewModal from '../../components/ui/InvoicePreviewModal';

const statusConfig = {
  paid: { label: '✔ Ödendi', cls: 'bg-green-100 text-green-700 hover:shadow-sm hover:scale-105 transition-all duration-200 border border-transparent' },
  pending: { label: '● Bekliyor', cls: 'bg-amber-100 text-amber-700 hover:shadow-sm hover:scale-105 transition-all duration-200 border border-transparent' },
  unpaid: { label: '✖ Ödenmedi', cls: 'bg-red-100 text-red-700 hover:shadow-sm hover:scale-105 transition-all duration-200 border border-transparent' },
};

interface Payment { id: number; apartment_number: number; owner_name: string; room_type: string; amount: number; status: string; note: string; paid_at: string; }
interface Aidat { id: number; month: number; year: number; amount: number; }
interface Expense { id: number; title: string; date: string; amount: number; invoice_path: string | null; }

export default function AidatPage() {
  const [aidats, setAidats] = useState<Aidat[]>([]);
  const [selectedAidat, setSelectedAidat] = useState<Aidat | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({ paid_count: 0, pending_count: 0, unpaid_count: 0, total: 18, collected: 0, total_expected: 0 });
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [newPeriod, setNewPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [addingPeriod, setAddingPeriod] = useState(false);
  const [deletingPeriod, setDeletingPeriod] = useState(false);
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

  const exportPDF = () => {
    try {
      if (!selectedAidat) return toast.error('Lütfen bir aidat dönemi seçin.');
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Cumhuriyet Apartmani Aidat Raporu`, 14, 22);
      doc.setFontSize(12);
      doc.text(`Donem: ${MONTHS[selectedAidat.month - 1]} ${selectedAidat.year}`, 14, 30);
      
      const tableData = payments.map(p => {
        const s = statusConfig[p.status as keyof typeof statusConfig] || statusConfig.unpaid;
        return [
          `Daire ${p.apartment_number}`,
          p.owner_name,
          p.room_type,
          formatCurrency(p.amount),
          s.label,
          p.paid_at ? new Date(p.paid_at).toLocaleDateString('tr-TR') : '-',
          p.note || '-'
        ];
      });

      autoTable(doc, {
        startY: 36,
        head: [['Daire No', 'Malik', 'Tip', 'Tutar', 'Aidat Durumu', 'Odeme Tarihi', 'Not']],
        body: tableData,
      });

      doc.save('Aidatlar_PDF.pdf');
      toast.success('PDF başarıyla indirildi!');
    } catch { toast.error('PDF oluşturulurken hata!'); }
  };

  const exportExcel = () => {
    try {
      if (!selectedAidat) return toast.error('Lütfen bir aidat dönemi seçin.');
      const dataToExport = payments.map(p => {
        const s = statusConfig[p.status as keyof typeof statusConfig] || statusConfig.unpaid;
        return {
          'Daire No': `Daire ${p.apartment_number}`,
          'Malik': p.owner_name,
          'Tip': p.room_type,
          'Tutar': p.amount,
          'Aidat Durumu': s.label,
          'Ödeme Tarihi': p.paid_at ? new Date(p.paid_at).toLocaleDateString('tr-TR') : '-',
          'Not': p.note || '-'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Aidatlar');
      XLSX.writeFile(workbook, 'Aidatlar_Excel.xlsx');
      toast.success('Excel başarıyla indirildi!');
    } catch { toast.error('Excel oluşturulurken hata!'); }
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

  const handleDeletePeriod = async () => {
    if (!selectedAidat) return;
    const label = `${MONTHS[selectedAidat.month - 1]} ${selectedAidat.year}`;
    if (!window.confirm(`"${label}" dönemini silmek istediğinize emin misiniz?\nTüm ödeme kayıtları da silinecektir.`)) return;
    setDeletingPeriod(true);
    try {
      await aidatsApi.delete(selectedAidat.id);
      toast.success(`${label} dönemi silindi.`);
      const r = await aidatsApi.getAll();
      setAidats(r.data);
      if (r.data.length > 0) selectAidat(r.data[0]);
      else { setSelectedAidat(null); setPayments([]); }
    } catch (e: any) { toast.error(e.response?.data?.error || 'Silme başarısız.'); }
    finally { setDeletingPeriod(false); }
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
        <div className="flex gap-2 self-start">
          {selectedAidat && (
            <button
              onClick={handleDeletePeriod}
              disabled={deletingPeriod}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
              title="Seçili dönemi sil"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              {deletingPeriod ? 'Siliniyor...' : 'Dönemi Sil'}
            </button>
          )}
          <button onClick={() => setAddingPeriod(!addingPeriod)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span> Yeni Dönem
          </button>
        </div>
      </div>

      {/* New period form */}
      {addingPeriod && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
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
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreatePeriod} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold">Oluştur</button>
            <button onClick={() => setAddingPeriod(false)} className="px-4 py-2 rounded-lg text-sm border border-slate-200">İptal</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200"><p className="text-xs text-slate-500 mb-1">Beklenen Toplam</p><p className="text-xl font-bold">{formatCurrency(stats.total_expected)}</p></div>
        <div className="bg-white p-5 rounded-xl border border-slate-200"><p className="text-xs text-slate-500 mb-1">Tahsil Edilen</p><p className="text-xl font-bold text-green-600">{formatCurrency(stats.collected)}</p></div>
        <div className="bg-white p-5 rounded-xl border border-slate-200"><p className="text-xs text-slate-500 mb-1">Ödenmemiş</p><p className="text-xl font-bold text-red-500">{stats.unpaid_count}</p></div>
        <div className="bg-white p-5 rounded-xl border border-slate-200"><p className="text-xs text-slate-500 mb-1">Beklemede</p><p className="text-xl font-bold text-amber-600">{stats.pending_count}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Aidat table */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
            <h3 className="font-bold">Aidat Durumları (18 Daire)</h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap gap-1">
                {aidats.slice(0, 6).map(a => (
                  <button key={a.id} onClick={() => selectAidat(a)}
                    className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${selectedAidat?.id === a.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {MONTHS[a.month - 1]} {a.year}
                  </button>
                ))}
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
              <div className="flex gap-2">
                <button onClick={exportPDF} className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> PDF İndir
                </button>
                <button onClick={exportExcel} className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">table_chart</span> Excel İndir
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                  <th className="px-5 py-3">Daire No</th>
                  <th className="px-5 py-3">Sakin</th>
                  <th className="px-5 py-3">Tip</th>
                  <th className="px-5 py-3">Tutar</th>
                  <th className="px-5 py-3 text-center">Durum</th>
                  <th className="px-5 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => {
                  const s = statusConfig[p.status as keyof typeof statusConfig] || statusConfig.unpaid;
                  
                  // Row highlight logic based on status
                  let rowBorderCls = "border-l-4 border-transparent";
                  if (p.status === 'paid') rowBorderCls = "border-l-4 border-green-400";
                  else if (p.status === 'unpaid') rowBorderCls = "border-l-4 border-red-400";
                  
                  return (
                    <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${rowBorderCls}`}>
                      <td className="px-5 py-3.5 font-medium text-sm">Daire {p.apartment_number}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{p.owner_name}</td>
                      <td className="px-5 py-3.5 text-sm">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.room_type === '3+1' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                          {p.room_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold">{formatCurrency(p.amount)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={p.status}
                          onChange={e => handleStatusChange(p.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-lg py-1.5 px-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 cursor-pointer hover:border-gray-400"
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
          <div className="bg-white p-5 rounded-xl border border-slate-200">
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
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h3 className="font-bold mb-4">Son Giderler</h3>
            <div className="space-y-3">
              {recentExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{exp.title}</p>
                    <p className="text-xs text-slate-500">{new Date(exp.date).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-500">-{formatCurrency(exp.amount)}</p>
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

      {previewUrl && <InvoicePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
    </div>
  );
}
