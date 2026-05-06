import { useState, useEffect } from 'react';
import { announcementsApi } from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const card = "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/[0.07]";
const inp = "w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400/30 transition-all";
const lbl = "block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-2";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', date: '' });

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try { const res = await announcementsApi.getAll(); setAnnouncements(res.data); }
    catch { toast.error('Duyurular yüklenemedi.'); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await announcementsApi.create(form);
      toast.success('Duyuru eklendi!');
      setAdding(false); setForm({ title: '', message: '', date: '' });
      fetchAnnouncements();
    } catch { toast.error('Duyuru eklenirken hata oluştu.'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Emin misiniz?')) return;
    try { await announcementsApi.delete(id); toast.success('Duyuru silindi!'); fetchAnnouncements(); }
    catch { toast.error('Silme başarısız.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Duyurular</h1>
          <p className="text-gray-400 dark:text-white/40 text-sm mt-1">Önemli apartman duyuruları ve bilgilendirmeler</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => setAdding(!adding)}
            className="bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
            <span className="material-symbols-outlined text-[18px]">{adding ? 'close' : 'add'}</span>
            {adding ? 'İptal' : 'Yeni Duyuru'}
          </button>
        )}
      </div>

      {adding && (
        <div className={`${card} rounded-2xl p-6`}>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-pink-500 dark:text-pink-400 text-[18px]">campaign</span>
            Yeni Duyuru Oluştur
          </h3>
          <form onSubmit={handleCreate} className="space-y-4 max-w-xl">
            <div>
              <label className={lbl}>Başlık</label>
              <input required className={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Tarih</label>
              <input required type="date" className={inp} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Mesaj</label>
              <textarea required rows={5} className={`${inp} resize-none`} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            </div>
            <button type="submit"
              className="bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20">
              Yayınla
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {announcements.map(ann => (
          <div key={ann.id} className={`${card} p-6 rounded-2xl group hover:border-pink-200 dark:hover:border-pink-500/20 transition-all`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-pink-50 dark:bg-pink-500/15 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-pink-500 dark:text-pink-400 text-[16px]">campaign</span>
                </div>
                <h3 className="font-black text-gray-900 dark:text-white text-base leading-tight">{ann.title}</h3>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span className="text-xs font-bold text-gray-400 dark:text-white/30 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full border border-gray-200 dark:border-white/[0.06]">
                  {new Date(ann.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <button onClick={() => handleDelete(ann.id)}
                    className="text-gray-300 dark:text-white/20 hover:text-rose-500 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-1">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-500 dark:text-white/60 leading-relaxed whitespace-pre-wrap text-sm pl-11">{ann.message}</p>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className={`${card} rounded-2xl p-12 text-center text-gray-300 dark:text-white/30`}>
            <span className="material-symbols-outlined text-4xl mb-3 block">campaign</span>
            Henüz bir duyuru bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}
