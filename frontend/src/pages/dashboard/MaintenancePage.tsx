import { useState, useEffect } from 'react';
import { maintenanceApi } from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const inp = "w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400/30 transition-all";
const lbl = "block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2";

const getStatus = (nextDate: string) => {
  if (!nextDate) return null;
  const days = Math.floor((new Date(nextDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: 'Gecikmiş', cls: 'bg-rose-500/15 text-rose-400', days };
  if (days <= 7) return { label: 'Yaklaşıyor', cls: 'bg-amber-500/15 text-amber-400', days };
  return { label: 'Planlı', cls: 'bg-emerald-500/15 text-emerald-400', days };
};

export default function MaintenancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ maintenance_type: '', description: '', last_maintenance_date: '', next_maintenance_date: '' });

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try { const res = await maintenanceApi.getAll(); setRecords(res.data); }
    catch { toast.error('Kayıtlar yüklenemedi.'); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await maintenanceApi.create(form);
      toast.success('Kayıt eklendi!');
      setAdding(false); setForm({ maintenance_type: '', description: '', last_maintenance_date: '', next_maintenance_date: '' });
      fetchRecords();
    } catch { toast.error('Eklenirken hata oluştu.'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try { await maintenanceApi.delete(id); toast.success('Kayıt silindi!'); fetchRecords(); }
    catch { toast.error('Silme başarısız.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Bakım Takibi</h1>
          <p className="text-white/40 text-sm mt-1">Asansör, kazan ve diğer periyodik bakımlar</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => setAdding(!adding)}
            className="bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
            <span className="material-symbols-outlined text-[18px]">{adding ? 'close' : 'add'}</span>
            {adding ? 'İptal' : 'Yeni Bakım'}
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-zinc-900 border border-white/[0.07] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-[18px]">engineering</span>
            Yeni Bakım Kaydı
          </h3>
          <form onSubmit={handleCreate} className="space-y-4 max-w-xl">
            <div>
              <label className={lbl}>Bakım Türü</label>
              <input required placeholder="Örn: Asansör Periyodik Bakım" className={inp}
                value={form.maintenance_type} onChange={e => setForm({ ...form, maintenance_type: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Son Bakım Tarihi</label>
                <input type="date" className={inp} value={form.last_maintenance_date} onChange={e => setForm({ ...form, last_maintenance_date: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Sonraki Bakım Tarihi</label>
                <input type="date" className={inp} value={form.next_maintenance_date} onChange={e => setForm({ ...form, next_maintenance_date: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={lbl}>Açıklama</label>
              <input className={inp} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <button type="submit"
              className="bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20">
              Kaydet
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map(record => {
          const status = getStatus(record.next_maintenance_date);
          return (
            <div key={record.id} className="bg-zinc-900 border border-white/[0.07] p-5 rounded-2xl flex flex-col group hover:border-amber-500/20 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-amber-400 text-xl">engineering</span>
                  </div>
                  <h3 className="font-bold text-sm text-white leading-snug line-clamp-2 pr-2">{record.maintenance_type}</h3>
                </div>
                {status && (
                  <span className={`flex-shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full ${status.cls}`}>
                    {status.label}
                  </span>
                )}
              </div>

              {record.description && <p className="text-xs text-white/40 mb-4 flex-1">{record.description}</p>}

              <div className="mt-auto pt-4 border-t border-white/[0.06] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Son Bakım</span>
                  <span className="font-semibold text-white/70">
                    {record.last_maintenance_date ? new Date(record.last_maintenance_date).toLocaleDateString('tr-TR') : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Sonraki Bakım</span>
                  <span className={`font-black ${status && status.days < 0 ? 'text-rose-400' : status && status.days <= 7 ? 'text-amber-400' : 'text-white'}`}>
                    {record.next_maintenance_date ? new Date(record.next_maintenance_date).toLocaleDateString('tr-TR') : '—'}
                  </span>
                </div>
                {status && status.days >= 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Kalan</span>
                    <span className="text-white/60 font-bold">{status.days} gün</span>
                  </div>
                )}
              </div>

              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button onClick={() => handleDelete(record.id)}
                  className="mt-4 self-end text-white/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 text-xs">
                  <span className="material-symbols-outlined text-[16px]">delete</span> Sil
                </button>
              )}
            </div>
          );
        })}
        {records.length === 0 && (
          <div className="col-span-full bg-zinc-900 border border-white/[0.07] rounded-2xl p-12 text-center text-white/30">
            <span className="material-symbols-outlined text-4xl mb-3 block">handyman</span>
            Henüz bakım kaydı bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}
