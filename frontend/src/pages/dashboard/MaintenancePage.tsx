import { useState, useEffect } from 'react';
import { maintenanceApi } from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function MaintenancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ maintenance_type: '', description: '', last_maintenance_date: '', next_maintenance_date: '' });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await maintenanceApi.getAll();
      setRecords(res.data);
    } catch {
      toast.error('Kayıtlar yüklenemedi.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await maintenanceApi.create(form);
      toast.success('Kayıt eklendi!');
      setAdding(false);
      setForm({ maintenance_type: '', description: '', last_maintenance_date: '', next_maintenance_date: '' });
      fetchRecords();
    } catch {
      toast.error('Eklenirken bir hata oluştu.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      await maintenanceApi.delete(id);
      toast.success('Kayıt silindi!');
      fetchRecords();
    } catch {
      toast.error('Silme başarısız.');
    }
  };

  // Determine if a maintenance is past due or upcoming quickly
  const getStatus = (nextDate: string) => {
    if (!nextDate) return null;
    const diff = new Date(nextDate).getTime() - new Date().getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: 'Gecikmiş', color: 'text-red-600 bg-red-100' };
    if (days <= 7) return { label: 'Yaklaşıyor', color: 'text-amber-600 bg-amber-100' };
    return { label: 'Planlı', color: 'text-emerald-600 bg-emerald-100' };
  };

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bakım Takibi</h1>
          <p className="text-slate-500 text-sm mt-1">Asansör, kazan ve diğer periyodik bakımlar</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => setAdding(!adding)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">{adding ? 'close' : 'add'}</span>
            {adding ? 'İptal' : 'Yeni Bakım'}
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1.5">Bakım Türü</label>
              <input required placeholder="Örn: Asansör Periyodik Bakım" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={form.maintenance_type} onChange={e => setForm({...form, maintenance_type: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Son Bakım Tarihi</label>
              <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={form.last_maintenance_date} onChange={e => setForm({...form, last_maintenance_date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Sonraki Bakım Tarihi</label>
              <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={form.next_maintenance_date} onChange={e => setForm({...form, next_maintenance_date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Açıklama</label>
              <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold">Kaydet</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map(record => {
          const status = getStatus(record.next_maintenance_date);
          return (
            <div key={record.id} className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col relative overflow-hidden">
              {status && <div className={`absolute top-4 right-4 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${status.color}`}>{status.label}</div>}
              
              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">engineering</span>
                </div>
                <h3 className="font-bold text-sm line-clamp-2 pr-16">{record.maintenance_type}</h3>
              </div>
              
              {record.description && <p className="text-xs text-slate-500 mb-4">{record.description}</p>}
              
              <div className="mt-auto space-y-2 pt-4 border-t border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Son Bakım:</span>
                  <span className="font-semibold">{record.last_maintenance_date ? new Date(record.last_maintenance_date).toLocaleDateString('tr-TR') : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sonraki Bakım:</span>
                  <span className="font-bold text-slate-800">{record.next_maintenance_date ? new Date(record.next_maintenance_date).toLocaleDateString('tr-TR') : '-'}</span>
                </div>
              </div>

              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button onClick={() => handleDelete(record.id)} className="absolute bottom-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              )}
            </div>
          );
        })}
        {records.length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-500">Henüz bakım kaydı bulunmuyor.</div>
        )}
      </div>
    </div>
  );
}
