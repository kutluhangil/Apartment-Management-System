import { useState, useEffect } from 'react';
import { announcementsApi } from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', date: '' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await announcementsApi.getAll();
      setAnnouncements(res.data);
    } catch {
      toast.error('Duyurular yüklenemedi.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await announcementsApi.create(form);
      toast.success('Duyuru eklendi!');
      setAdding(false);
      setForm({ title: '', message: '', date: '' });
      fetchAnnouncements();
    } catch {
      toast.error('Duyuru eklenirken bir hata oluştu.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Emin misiniz?')) return;
    try {
      await announcementsApi.delete(id);
      toast.success('Duyuru silindi!');
      fetchAnnouncements();
    } catch {
      toast.error('Silme başarısız.');
    }
  };

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Duyurular</h1>
          <p className="text-slate-500 text-sm mt-1">Önemli apartman duyuruları ve bilgilendirmeler</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => setAdding(!adding)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">{adding ? 'close' : 'add'}</span>
            {adding ? 'İptal' : 'Yeni Duyuru'}
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6">
          <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1.5">Başlık</label>
              <input required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Tarih</label>
              <input required type="date" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Mesaj</label>
              <textarea required rows={4} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
            </div>
            <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold">Yayınla</button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {announcements.map(ann => (
          <div key={ann.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 relative group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-primary">{ann.title}</h3>
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{new Date(ann.date).toLocaleDateString('tr-TR')}</span>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <button onClick={() => handleDelete(ann.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                )}
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{ann.message}</p>
          </div>
        ))}
        {announcements.length === 0 && (
          <p className="text-slate-500 text-center py-10">Henüz bir duyuru bulunmuyor.</p>
        )}
      </div>
    </div>
  );
}
