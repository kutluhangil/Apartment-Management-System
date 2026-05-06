import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { aidatsApi, expensesApi } from "../../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { MONTHS, formatCurrency } from "../../utils/format";
import InvoicePreviewModal from "../../components/ui/InvoicePreviewModal";

const statusConfig = {
  paid:    { label: "Ödendi",    cls: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" },
  pending: { label: "Bekliyor", cls: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20" },
  unpaid:  { label: "Ödenmedi", cls: "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20" },
};

const card = "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/[0.07]";
const inp  = "w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400/30 transition-all";
const sel  = "w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all";
const lbl  = "block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-2";
const btnP = "bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20";
const btnS = "bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all";

interface Payment { id: number; apartment_number: number; owner_name: string; room_type: string; amount: number; status: string; note: string; paid_at: string; }
interface Aidat   { id: number; month: number; year: number; amount: number; }
interface Expense { id: number; title: string; date: string; amount: number; invoice_path: string | null; }

export default function AidatPage() {
  const [aidats, setAidats] = useState<Aidat[]>([]);
  const [selectedAidat, setSelectedAidat] = useState<Aidat | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({ paid_count: 0, pending_count: 0, unpaid_count: 0, total: 18, collected: 0, total_expected: 0 });
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [newPeriod, setNewPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount_2plus1: 800, amount_3plus1: 1000 });
  const [addingPeriod, setAddingPeriod] = useState(false);
  const [deletingPeriod, setDeletingPeriod] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: "", amount: "", date: "", description: "" });
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    aidatsApi.getAll().then(r => { setAidats(r.data); if (r.data.length > 0) selectAidat(r.data[0]); }).catch(() => {});
    expensesApi.getAll({ type: "expense", limit: 5 }).then(r => setRecentExpenses(r.data.expenses)).catch(() => {});
  }, []);

  const selectAidat = (aidat: Aidat) => {
    setSelectedAidat(aidat);
    aidatsApi.getPayments(aidat.id).then(r => setPayments(r.data)).catch(() => {});
    aidatsApi.getStats(aidat.id).then(r => setStats(r.data)).catch(() => {});
  };

  const exportPDF = () => {
    if (!selectedAidat) return toast.error("Lütfen bir aidat dönemi seçin.");
    try {
      const doc = new jsPDF();
      doc.setFontSize(18); doc.text("Cumhuriyet Apartmani Aidat Raporu", 14, 22);
      doc.setFontSize(12); doc.text(`Donem: ${MONTHS[selectedAidat.month - 1]} ${selectedAidat.year}`, 14, 30);
      autoTable(doc, {
        startY: 36,
        head: [["Daire No", "Malik", "Tip", "Tutar", "Durum", "Odeme Tarihi", "Not"]],
        body: payments.map(p => {
          const s = statusConfig[p.status as keyof typeof statusConfig] || statusConfig.unpaid;
          return [`Daire ${p.apartment_number}`, p.owner_name, p.room_type, formatCurrency(p.amount), s.label, p.paid_at ? new Date(p.paid_at).toLocaleDateString("tr-TR") : "-", p.note || "-"];
        }),
      });
      doc.save("Aidatlar_PDF.pdf");
      toast.success("PDF indirildi!");
    } catch { toast.error("PDF oluşturulamadı!"); }
  };

  const exportExcel = () => {
    if (!selectedAidat) return toast.error("Lütfen bir aidat dönemi seçin.");
    try {
      const ws = XLSX.utils.json_to_sheet(payments.map(p => ({
        "Daire No": `Daire ${p.apartment_number}`, "Malik": p.owner_name, "Tip": p.room_type,
        "Tutar": p.amount, "Durum": (statusConfig[p.status as keyof typeof statusConfig] || statusConfig.unpaid).label,
        "Ödeme Tarihi": p.paid_at ? new Date(p.paid_at).toLocaleDateString("tr-TR") : "-", "Not": p.note || "-",
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Aidatlar");
      XLSX.writeFile(wb, "Aidatlar_Excel.xlsx");
      toast.success("Excel indirildi!");
    } catch { toast.error("Excel oluşturulamadı!"); }
  };

  const handleStatusChange = async (paymentId: number, status: string) => {
    try {
      await aidatsApi.updatePayment(paymentId, { status, paid_at: status === "paid" ? new Date().toISOString() : "" });
      if (selectedAidat) {
        const r = await aidatsApi.getPayments(selectedAidat.id); setPayments(r.data);
        const s = await aidatsApi.getStats(selectedAidat.id); setStats(s.data);
      }
      toast.success("Durum güncellendi.");
    } catch { toast.error("Güncelleme başarısız."); }
  };

  const handleDeletePeriod = async () => {
    if (!selectedAidat) return;
    const label = `${MONTHS[selectedAidat.month - 1]} ${selectedAidat.year}`;
    if (!window.confirm(`"${label}" dönemini silmek istediğinize emin misiniz?`)) return;
    setDeletingPeriod(true);
    try {
      await aidatsApi.delete(selectedAidat.id);
      toast.success(`${label} dönemi silindi.`);
      const r = await aidatsApi.getAll(); setAidats(r.data);
      if (r.data.length > 0) selectAidat(r.data[0]); else { setSelectedAidat(null); setPayments([]); }
    } catch (e: any) { toast.error(e.response?.data?.error || "Silme başarısız."); }
    finally { setDeletingPeriod(false); }
  };

  const handleCreatePeriod = async () => {
    if (!newPeriod.amount_2plus1 || newPeriod.amount_2plus1 <= 0 || !newPeriod.amount_3plus1 || newPeriod.amount_3plus1 <= 0)
      return toast.error("Lütfen geçerli aidat tutarları girin.");
    try {
      await aidatsApi.create(newPeriod);
      toast.success("Aidat dönemi oluşturuldu!");
      const r = await aidatsApi.getAll(); setAidats(r.data);
      if (r.data.length > 0) selectAidat(r.data[0]);
      setAddingPeriod(false);
    } catch (e: any) { toast.error(e.response?.data?.error || "Hata oluştu."); }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount || !expenseForm.date) return toast.error("Başlık, tutar ve tarih zorunludur.");
    setLoading(true);
    const fd = new FormData();
    fd.append("title", expenseForm.title); fd.append("amount", expenseForm.amount);
    fd.append("date", expenseForm.date); fd.append("description", expenseForm.description);
    if (file) fd.append("invoice", file);
    try {
      await expensesApi.create(fd);
      toast.success("Gider kaydedildi!");
      setExpenseForm({ title: "", amount: "", date: "", description: "" }); setFile(null);
      const r = await expensesApi.getAll({ type: "expense", limit: 5 }); setRecentExpenses(r.data.expenses);
    } catch (e: any) { toast.error(e.response?.data?.error || "Kayıt başarısız."); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Aidat Yönetimi</h1>
          {selectedAidat && <p className="text-gray-400 dark:text-white/40 text-sm mt-1">{MONTHS[selectedAidat.month - 1]} {selectedAidat.year} Dönemi</p>}
        </div>
        <div className="flex gap-2 self-start">
          {selectedAidat && (
            <button onClick={handleDeletePeriod} disabled={deletingPeriod}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500 hover:text-rose-800 dark:hover:text-white transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">delete</span>
              {deletingPeriod ? "Siliniyor..." : "Dönemi Sil"}
            </button>
          )}
          <button onClick={() => setAddingPeriod(!addingPeriod)}
            className={`${btnP} px-4 py-2.5 rounded-xl text-sm flex items-center gap-2`}>
            <span className="material-symbols-outlined text-[18px]">add</span> Yeni Dönem
          </button>
        </div>
      </div>

      {/* New period form */}
      {addingPeriod && (
        <div className={`${card} rounded-2xl p-6`}>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5">Yeni Aidat Dönemi Oluştur</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className={lbl}>Ay</label><select className={sel} value={newPeriod.month} onChange={e => setNewPeriod(p => ({ ...p, month: +e.target.value }))}>{MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select></div>
            <div><label className={lbl}>Yıl</label><input type="number" className={inp} value={newPeriod.year} onChange={e => setNewPeriod(p => ({ ...p, year: +e.target.value }))} /></div>
            <div><label className={lbl}>2+1 Aidat (₺)</label><input type="number" className={inp} value={newPeriod.amount_2plus1} onChange={e => setNewPeriod(p => ({ ...p, amount_2plus1: +e.target.value }))} /></div>
            <div><label className={lbl}>3+1 Aidat (₺)</label><input type="number" className={inp} value={newPeriod.amount_3plus1} onChange={e => setNewPeriod(p => ({ ...p, amount_3plus1: +e.target.value }))} /></div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={handleCreatePeriod} className={`${btnP} px-5 py-2.5 rounded-xl text-sm`}>Oluştur</button>
            <button onClick={() => setAddingPeriod(false)} className={`${btnS} px-5 py-2.5 rounded-xl text-sm font-semibold`}>İptal</button>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Beklenen",      value: formatCurrency(stats.total_expected), color: "text-gray-900 dark:text-white" },
          { label: "Tahsil Edilen", value: formatCurrency(stats.collected),      color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Ödenmemiş",    value: String(stats.unpaid_count),            color: "text-rose-600 dark:text-rose-400" },
          { label: "Beklemede",    value: String(stats.pending_count),           color: "text-amber-600 dark:text-amber-400" },
        ].map(s => (
          <div key={s.label} className={`${card} p-5 rounded-2xl`}>
            <p className={lbl}>{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Payments table */}
        <div className={`${card} lg:col-span-8 rounded-2xl overflow-hidden`}>
          <div className="p-5 border-b border-gray-200 dark:border-white/[0.07] flex flex-wrap gap-4 items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Aidat Durumları (18 Daire)</h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-1">
                {aidats.slice(0, 6).map(a => (
                  <button key={a.id} onClick={() => selectAidat(a)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                      selectedAidat?.id === a.id
                        ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30"
                        : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                    }`}>
                    {MONTHS[a.month - 1]} {a.year}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={exportPDF} className={`${btnS} flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold`}>
                  <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span> PDF
                </button>
                <button onClick={exportExcel} className={`${btnS} flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold`}>
                  <span className="material-symbols-outlined text-[15px]">table_chart</span> Excel
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/[0.03] text-[11px] uppercase tracking-wider text-gray-400 dark:text-white/40">
                  <th className="px-5 py-3">Daire</th>
                  <th className="px-5 py-3">Sakin</th>
                  <th className="px-5 py-3">Tip</th>
                  <th className="px-5 py-3">Tutar</th>
                  <th className="px-5 py-3 text-center">Durum</th>
                  <th className="px-5 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {payments.map(p => {
                  const s = statusConfig[p.status as keyof typeof statusConfig] || statusConfig.unpaid;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3.5 text-gray-900 dark:text-white font-bold text-sm">Daire {p.apartment_number}</td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-white/60 text-sm">{p.owner_name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${p.room_type === "3+1" ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300" : "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300"}`}>
                          {p.room_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-900 dark:text-white font-bold text-sm">{formatCurrency(p.amount)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <select value={p.status} onChange={e => handleStatusChange(p.id, e.target.value)}
                          className="text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer">
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

        {/* Right sidebar */}
        <div className="lg:col-span-4 space-y-5">
          {/* Expense form */}
          <div className={`${card} p-5 rounded-2xl`}>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-5">Gider Kaydet</h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-3">
              <div>
                <label className={lbl}>Gider Başlığı</label>
                <input className={inp} placeholder="Örn: Asansör Bakımı" value={expenseForm.title} onChange={e => setExpenseForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Tutar (₺)</label><input type="number" className={inp} placeholder="0" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} /></div>
                <div><label className={lbl}>Tarih</label><input type="date" className={inp} value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} /></div>
              </div>
              <div>
                <label className={lbl}>Fatura (PDF/JPG/PNG)</label>
                <div
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${dragging ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                  onClick={() => document.getElementById("afile-input")?.click()}
                >
                  <span className="material-symbols-outlined text-gray-300 dark:text-white/30 text-2xl mb-1">upload_file</span>
                  <p className="text-xs text-gray-400 dark:text-white/40">
                    {file ? <span className="text-indigo-600 dark:text-indigo-400 font-medium">{file.name}</span> : <>Sürükle veya <span className="text-indigo-600 dark:text-indigo-400 font-bold">seç</span></>}
                  </p>
                  <input id="afile-input" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <button type="submit" disabled={loading} className={`${btnP} w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50`}>
                {loading ? <><span className="material-symbols-outlined animate-spin text-base">refresh</span> Kaydediliyor...</> : "Gider Ekle"}
              </button>
            </form>
          </div>

          {/* Recent expenses */}
          <div className={`${card} p-5 rounded-2xl`}>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Son Giderler</h3>
            <div className="space-y-2.5">
              {recentExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/[0.05] last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{exp.title}</p>
                    <p className="text-xs text-gray-400 dark:text-white/40">{new Date(exp.date).toLocaleDateString("tr-TR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-rose-600 dark:text-rose-400">−{formatCurrency(exp.amount)}</p>
                    {exp.invoice_path && (
                      <button onClick={() => setPreviewUrl(`/uploads/${exp.invoice_path}`)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 justify-end mt-0.5">
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
