import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { meetingsApi, apartmentsApi } from '../../api';

const statusConfig: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Tamamlandı', cls: 'bg-green-100 text-green-700' },
  info: { label: 'Bilgi', cls: 'bg-blue-100 text-blue-700' },
  important: { label: 'Önemli', cls: 'bg-amber-100 text-amber-700' },
  archived: { label: 'Arşiv', cls: 'bg-gray-100 text-gray-700' },
  planned: { label: 'Planlandı', cls: 'bg-slate-100 text-slate-700' },
};

interface Meeting { id: number; title: string; meeting_type: string; date: string; time: string; notes: string; decisions: string[]; attendee_count: number; status: string; }
interface Apartment { id: number; number: number; owner_name: string; floor: number; }

export default function MeetingManagePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [form, setForm] = useState({ title: '', meeting_type: 'OLAĞAN GENEL KURUL', date: '', time: '', notes: '', status: 'completed' });
  const [decisionsText, setDecisionsText] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMeetings = () => meetingsApi.getAll().then(r => setMeetings(r.data.meetings)).catch(() => {});

  useEffect(() => {
    fetchMeetings();
    apartmentsApi.getAll().then(r => setApartments(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) { toast.error('Konu ve tarih zorunludur.'); return; }
    setLoading(true);
    const decisions = decisionsText.split('\n').map(d => d.trim()).filter(Boolean);
    try {
      await meetingsApi.create({ ...form, decisions, attendee_count: apartments.length });
      toast.success('Toplantı kaydedildi!');
      setForm({ title: '', meeting_type: 'OLAĞAN GENEL KURUL', date: '', time: '', notes: '', status: 'completed' });
      setDecisionsText('');
      fetchMeetings();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Hata.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Toplantıyı sil?')) return;
    try { await meetingsApi.delete(id); toast.success('Silindi.'); fetchMeetings(); }
    catch { toast.error('Silinemedi.'); }
  };

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Toplantı Yönetimi</h1>
        <p className="text-slate-500 text-sm mt-1">Yeni toplantılar oluşturun ve geçmiş kararları inceleyin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">add_circle</span> Yeni Toplantı Oluştur
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Toplantı Konusu</label>
                <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Örn: 2025 Olağan Genel Kurul" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Toplantı Türü</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.meeting_type} onChange={e => setForm(f => ({ ...f, meeting_type: e.target.value }))}>
                    {['OLAĞAN GENEL KURUL', 'YÖNETİM KURULU', 'ACİL TOPLANTI', 'YILLIK TOPLANTI', 'GENEL TOPLANTI'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Durum</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {Object.entries(statusConfig).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tarih</label>
                  <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Saat</label>
                  <input type="time" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Toplantı Notları ve Gündem</label>
                <textarea className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" rows={4} placeholder="Gündem maddelerini buraya yazınız..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Alınan Kararlar <span className="text-slate-400 font-normal">(her satıra bir karar)</span></label>
                <textarea className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" rows={3} placeholder="Her satıra bir karar yazın..." value={decisionsText} onChange={e => setDecisionsText(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={loading} className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
                  {loading ? 'Kaydediliyor...' : 'Toplantıyı Kaydet'}
                </button>
              </div>
            </form>
          </div>

          {/* Recent meetings */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold">Toplantı Kayıtları</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {meetings.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">Henüz toplantı kaydı yok.</div>
              ) : meetings.map(m => {
                const s = statusConfig[m.status] || statusConfig.archived;
                return (
                  <div key={m.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">{m.meeting_type}</span>
                        <h4 className="font-semibold mt-0.5">{m.title}</h4>
                      </div>
                      <div className="flex items-start gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${s.cls}`}>{s.label}</span>
                        <button onClick={() => handleDelete(m.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">calendar_today</span>{new Date(m.date).toLocaleDateString('tr-TR')}</span>
                      {m.time && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>{m.time}</span>}
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">group</span>{m.attendee_count} Daire</span>
                    </div>
                    {m.notes && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{m.notes}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold">Daire Listesi</h3>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">18 Daire</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {apartments.map(apt => (
                <div key={apt.id} className="p-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{String(apt.number).padStart(2,'0')}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{apt.owner_name}</p>
                    <p className="text-xs text-slate-500">Kat {apt.floor}</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 text-lg">chevron_right</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary text-white p-6 rounded-xl">
            <p className="text-sm opacity-80 mb-1">Toplam Toplantı</p>
            <h4 className="text-3xl font-black mb-3">{meetings.length}</h4>
            <p className="text-xs opacity-60 uppercase tracking-widest">Kayıtlı Toplantı</p>
          </div>
        </div>
      </div>
    </div>
  );
}
