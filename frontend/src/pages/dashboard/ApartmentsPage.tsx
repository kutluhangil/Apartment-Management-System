import { useState, useEffect } from 'react';
import { apartmentsApi } from '../../api';
import toast from 'react-hot-toast';

interface Apartment { id: number; number: number; owner_name: string; floor: number; profession?: string; notes: string; }

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Apartment | null>(null);

  useEffect(() => {
    apartmentsApi.getAll().then(r => setApartments(r.data)).catch(() => {});
  }, []);

  const filtered = apartments.filter(a =>
    a.owner_name.toLowerCase().includes(search.toLowerCase()) ||
    String(a.number).includes(search)
  );

  const handleSave = async () => {
    if (!editing) return;
    try {
      await apartmentsApi.update(editing.id, editing);
      setApartments(prev => prev.map(a => a.id === editing.id ? editing : a));
      toast.success('Güncellendi!');
      setEditing(null);
    } catch { toast.error('Güncelleme başarısız.'); }
  };

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daire Listesi</h1>
        <p className="text-slate-500 text-sm mt-1">Cumhuriyet Apartmanı'nın 18 dairesi</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
        <input
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Daire no veya isim ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(apt => (
          <div key={apt.id} className="relative group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {String(apt.number).padStart(2, '0')}
                </div>
                <div>
                  <h3 className="font-bold text-sm">{apt.owner_name}</h3>
                  <p className="text-xs text-slate-500">Kat {apt.floor} · Daire {apt.number}</p>
                </div>
              </div>
              <button onClick={() => setEditing({ ...apt })} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
            </div>
            {apt.notes && !apt.profession && <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 mt-2">{apt.notes}</p>}

            {/* Hover Tooltip/Modal */}
            <div className="absolute left-0 bottom-full mb-3 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 opacity-0 pointer-events-none scale-95 origin-bottom group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-50">
              <div className="flex items-center gap-3 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500 text-sm">person</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight text-slate-900 dark:text-slate-100">{apt.owner_name}</h4>
                  <p className="text-xs text-slate-500">Daire {apt.number}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Meslek:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{apt.profession || 'Belirtilmedi'}</span>
                </div>
                {apt.notes && (
                  <div className="ext-sm mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-slate-500 block mb-0.5">Not:</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{apt.notes}</span>
                  </div>
                )}
              </div>
              {/* Tooltip bottom arrow */}
              <div className="absolute left-6 -bottom-2 w-4 h-4 bg-white dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 transform rotate-45"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Daire {editing.number} Düzenle</h3>
              <button onClick={() => setEditing(null)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Daire Sahibi</label>
              <input className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editing.owner_name} onChange={e => setEditing(p => p ? ({ ...p, owner_name: e.target.value }) : null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Kat</label>
              <input type="number" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={editing.floor} onChange={e => setEditing(p => p ? ({ ...p, floor: +e.target.value }) : null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Meslek</label>
              <input type="text" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Örn: Avukat" value={editing.profession || ''} onChange={e => setEditing(p => p ? ({ ...p, profession: e.target.value }) : null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Notlar</label>
              <textarea className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" rows={3} value={editing.notes || ''} onChange={e => setEditing(p => p ? ({ ...p, notes: e.target.value }) : null)} />
            </div>
            <button onClick={handleSave} className="w-full bg-primary text-white py-2.5 rounded-lg font-bold hover:opacity-90">Kaydet</button>
          </div>
        </div>
      )}

      <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">info</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <strong className="text-primary">KALI YAPI / KALİ YAPI</strong> dairelerinin sakinleri henüz belirlenmemiştir. Güncellemek için düzenleme butonunu kullanın.
        </p>
      </div>
    </div>
  );
}
