import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { aidatsApi, expensesApi } from "../../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { MONTHS, formatCurrency } from "../../utils/format";
import InvoicePreviewModal from "../../components/ui/InvoicePreviewModal";

const statusConfig = {
  paid: {
    label: "✔ Ödendi",
    cls: "bg-green-100 text-green-700 hover:shadow-sm hover:scale-105 transition-all duration-200 border border-transparent",
  },
  pending: {
    label: "● Bekliyor",
    cls: "bg-amber-100 text-amber-700 hover:shadow-sm hover:scale-105 transition-all duration-200 border border-transparent",
  },
  unpaid: {
    label: "✖ Ödenmedi",
    cls: "bg-red-100 text-red-700 hover:shadow-sm hover:scale-105 transition-all duration-200 border border-transparent",
  },
};

interface Payment {
  id: number;
  apartment_number: number;
  owner_name: string;
  room_type: string;
  amount: number;
  status: string;
  note: string;
  paid_at: string;
}
interface Aidat {
  id: number;
  month: number;
  year: number;
  amount: number;
}
interface Expense {
  id: number;
  title: string;
  date: string;
  amount: number;
  invoice_path: string | null;
}

export default function AidatPage() {
  const [aidats, setAidats] = useState<Aidat[]>([]);
  const [selectedAidat, setSelectedAidat] = useState<Aidat | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    paid_count: 0,
    pending_count: 0,
    unpaid_count: 0,
    total: 18,
    collected: 0,
    total_expected: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);

  // ✅ FIX: amount eklendi
  const [newPeriod, setNewPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: 0,
  });

  const [addingPeriod, setAddingPeriod] = useState(false);
  const [deletingPeriod, setDeletingPeriod] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    date: "",
    description: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    aidatsApi.getAll().then((r) => {
      setAidats(r.data);
      if (r.data.length > 0) selectAidat(r.data[0]);
    });
    expensesApi
      .getAll({ type: "expense", limit: 5 })
      .then((r) => setRecentExpenses(r.data.expenses));
  }, []);

  const selectAidat = (aidat: Aidat) => {
    setSelectedAidat(aidat);
    aidatsApi.getPayments(aidat.id).then((r) => setPayments(r.data));
    aidatsApi.getStats(aidat.id).then((r) => setStats(r.data));
  };

  const handleCreatePeriod = async () => {
    try {
      await aidatsApi.create(newPeriod);
      toast.success("Aidat dönemi oluşturuldu!");
      const r = await aidatsApi.getAll();
      setAidats(r.data);
      if (r.data.length > 0) selectAidat(r.data[0]);
      setAddingPeriod(false);
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Hata oluştu.");
    }
  };

  return (
    <div className="p-5 md:p-8 space-y-6">
      {/* NEW PERIOD FORM */}
      {addingPeriod && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold mb-4">Yeni Aidat Dönemi Oluştur</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label>Ay</label>
              <select
                value={newPeriod.month}
                onChange={(e) =>
                  setNewPeriod((p) => ({ ...p, month: +e.target.value }))
                }
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Yıl</label>
              <input
                type="number"
                value={newPeriod.year}
                onChange={(e) =>
                  setNewPeriod((p) => ({ ...p, year: +e.target.value }))
                }
              />
            </div>

            {/* ✅ FIX: amount input */}
            <div>
              <label>Tutar (₺)</label>
              <input
                type="number"
                value={newPeriod.amount}
                onChange={(e) =>
                  setNewPeriod((p) => ({
                    ...p,
                    amount: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <button onClick={handleCreatePeriod}>Oluştur</button>
        </div>
      )}
    </div>
  );
}
