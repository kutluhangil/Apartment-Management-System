import { useState, useEffect } from 'react';
import { apartmentsApi } from '../../api';
import toast from 'react-hot-toast';

interface Apartment { id: number; number: number; owner_name: string; floor: number; profession?: string; owner_photo?: string; notes: string; }

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Apartment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [historyApt, setHistoryApt] = useState<Apartment | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    apartmentsApi.getAll().then(r => setApartments(r.data)).catch(() => {});
  }, []);

  const filtered = apartments.filter(a =>
    a.owner_name.toLowerCase().includes(search.toLowerCase()) ||
    String(a.number).includes(search)
  );

  const handleViewHistory = async (apt: Apartment) => {
    setHistoryApt(apt);
    setHistoryData([]);
    try {
      const res = await apartmentsApi.getAidatHistory(apt.id);
      setHistoryData(res.data);
    } catch {
      toast.error('Gemiş yüklenemedi.');
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      await apartmentsApi.update(editing.id, editing);
      setApartments(prev => prev.map(a => a.id === editing.id ? editing : a));
      toast.success('Güncellendi!');
      setEditing(null);
    } catch { toast.error('Güncelleme başarısız.'); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editing || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) return toast.error('Dosya çok büyük (Max 5MB)');
    
    setUploading(true);
    try {
      const res = await apartmentsApi.uploadPhoto(editing.id, file);
      const newPhotoUrl = res.data.url;
      setEditing({ ...editing, owner_photo: newPhotoUrl });
      setApartments(prev => prev.map(a => a.id === editing.id ? { ...a, owner_photo: newPhotoUrl } : a));
      toast.success('Fotoğraf yüklendi!');
    } catch {
      toast.error('Fotoğraf yüklenemedi.');
    } finally {
      setUploading(false);
    }
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
          <div key={apt.id} onClick={() => handleViewHistory(apt)} className="cursor-pointer relative group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
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
              <button onClick={(e) => { e.stopPropagation(); setEditing({ ...apt }); }} className="p-1.5 z-20 relative text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
            </div>
            {apt.notes && !apt.profession && <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 mt-2">{apt.notes}</p>}

            {/* Hover Tooltip/Modal (Fixing visibility issues) */}
            <div className="absolute left-1/2 -ml-32 bottom-full mb-4 w-64 rounded-2xl p-[2px] opacity-0 pointer-events-none scale-95 origin-bottom group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-50 shadow-2xl overflow-hidden
                            bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500 animate-gradient-xy">
              {/* Inner card content */}
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] p-4 relative z-10 flex flex-col items-center text-center">
                
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-800 mb-3 bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                  {apt.owner_photo ? (
                    <img src={`/api${apt.owner_photo}`} alt={apt.owner_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-slate-400 text-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">person</span>
                  )}
                </div>
                
                <h4 className="font-bold text-base leading-tight text-slate-900 dark:text-slate-100 mb-1">{apt.owner_name}</h4>
                <p className="text-xs text-primary font-medium mb-3">{apt.profession || 'Daire Sakini'}</p>
                
                {apt.notes && (
                  <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 w-full text-center">
                    {apt.notes}
                  </div>
                )}
                
              </div>
              
              {/* Tooltip bottom arrow matching gradient */}
              <div className="absolute left-1/2 -bottom-2 -ml-2 w-4 h-4 bg-purple-500 transform rotate-45 z-0 clip-path-bottom"></div>
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
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 relative border border-slate-200 dark:border-slate-700">
                  {editing.owner_photo ? (
                    <img src={`/api${editing.owner_photo}`} alt="Owner" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">person</span>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-primary cursor-pointer hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">upload</span>
                    Fotoğraf Yükle
                    {uploading && <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>}
                    <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handlePhotoUpload} disabled={uploading} />
                  </label>
                  <p className="text-[10px] text-slate-400">Format: JPG, PNG, WEBP. Maksimum: 5MB</p>
                </div>
              </div>

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

      {/* History modal */}
      {historyApt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setHistoryApt(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg">Daire {historyApt.number}</h3>
                <p className="text-xs text-slate-500">Aidat Geçmişi</p>
              </div>
              <button onClick={() => setHistoryApt(null)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {historyData.length > 0 ? historyData.map((record, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                  <div>
                    <p className="font-bold text-sm">{record.month} {record.year}</p>
                    <p className="text-xs text-slate-500 mt-1">{record.paid_at ? new Date(record.paid_at).toLocaleDateString('tr-TR') : 'Tarih Yok'}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="font-bold text-sm mb-1">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(record.amount || 0)}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      record.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                      record.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                      {record.status === 'paid' ? 'ÖDENDİ' : record.status === 'pending' ? 'BEKLİYOR' : 'ÖDENMEDİ'}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-slate-500 py-10 flex flex-col items-center">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
                  <p className="text-sm">Aidat geçmişi bulunmuyor.</p>
                </div>
              )}
            </div>
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
