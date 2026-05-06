import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { meetingsApi, apartmentsApi } from '../../api';
import { meetingStatusConfig, MEETING_TYPES } from '../../utils/meetings';

interface Meeting { id: number; title: string; meeting_type: string; date: string; time: string; notes: string; decisions: string[]; attendee_count: number; status: string; }
interface Apartment { id: number; number: number; owner_name: string; floor: number; }

const card = "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/[0.07]";
const inp = "w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400/30 transition-all";
const sel = "w-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all";
const lbl = "block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-2";

const statusCls: Record<string, string> = {
  completed: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  scheduled: 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400',
  cancelled: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400',
  archived:  'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-white/40',
};

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
    if (!form.title || !form.date) return toast.error('Konu ve tarih zorunludur.');
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Toplantı Yönetimi</h1>
        <p className="text-gray-400 dark:text-white/40 text-sm mt-1">Yeni toplantılar oluşturun ve geçmiş kararları inceleyin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: form + list */}
        <div className="lg:col-span-2 space-y-5">
          {/* Form */}
          <div className={`${card} p-6 rounded-2xl`}>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500 dark:text-indigo-400 text-[18px]">add_circle</span>
              Yeni Toplantı Oluştur
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={lbl}>Toplantı Konusu</label>
                <input className={inp} placeholder="Örn: 2025 Olağan Genel Kurul" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Toplantı Türü</label>
                  <select className={sel} value={form.meeting_type} onChange={e => setForm(f => ({ ...f, meeting_type: e.target.value }))}>
                    {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Durum</label>
                  <select className={sel} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {Object.entries(meetingStatusConfig).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Tarih</label>
                  <input type="date" className={inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Saat</label>
                  <input type="time" className={inp} value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={lbl}>Toplantı Notları ve Gündem</label>
                <textarea className={`${inp} resize-none`} rows={3} placeholder="Gündem maddelerini buraya yazınız..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Alınan Kararlar <span className="text-gray-300 dark:text-white/20 normal-case font-normal">(her satıra bir karar)</span></label>
                <textarea className={`${inp} resize-none`} rows={3} placeholder="Her satıra bir karar yazın..." value={decisionsText} onChange={e => setDecisionsText(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={loading}
                  className="bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20">
                  {loading ? 'Kaydediliyor...' : 'Toplantıyı Kaydet'}
                </button>
              </div>
            </form>
          </div>

          {/* Meeting list */}
          <div className={`${card} rounded-2xl overflow-hidden`}>
            <div className="p-5 border-b border-gray-200 dark:border-white/[0.07]">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Toplantı Kayıtları</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {meetings.length === 0 ? (
                <div className="p-8 text-center text-gray-400 dark:text-white/30 text-sm">Henüz toplantı kaydı yok.</div>
              ) : meetings.map(m => {
                const scls = statusCls[m.status] || statusCls.archived;
                const slabel = (meetingStatusConfig[m.status] || meetingStatusConfig.archived).label;
                return (
                  <div key={m.id} className="p-5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">{m.meeting_type}</span>
                        <h4 className="font-bold text-gray-900 dark:text-white mt-0.5">{m.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${scls}`}>{slabel}</span>
                        <button onClick={() => handleDelete(m.id)} className="p-1 text-gray-300 dark:text-white/20 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-400 dark:text-white/40">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">calendar_today</span>{new Date(m.date).toLocaleDateString('tr-TR')}</span>
                      {m.time && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>{m.time}</span>}
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">group</span>{m.attendee_count} Daire</span>
                    </div>
                    {m.notes && <p className="text-sm text-gray-500 dark:text-white/50 mt-2 line-clamp-2">{m.notes}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Apartments list */}
          <div className={`${card} rounded-2xl overflow-hidden`}>
            <div className="p-5 border-b border-gray-200 dark:border-white/[0.07] flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Daire Listesi</h3>
              <span className="text-xs bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2.5 py-1 rounded-full text-gray-500 dark:text-white/40 font-bold">18 Daire</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/[0.05] max-h-80 overflow-y-auto">
              {apartments.map(apt => (
                <div key={apt.id} className="p-3.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-black flex-shrink-0">
                    {String(apt.number).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{apt.owner_name}</p>
                    <p className="text-xs text-gray-400 dark:text-white/30">Kat {apt.floor}</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 dark:text-white/20 text-lg">chevron_right</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total meetings */}
          <div className="bg-gradient-to-br from-sky-400 via-blue-500 to-blue-700 p-6 rounded-2xl shadow-lg shadow-blue-500/20">
            <p className="text-sm font-bold text-white/60 mb-1">Toplam Toplantı</p>
            <h4 className="text-4xl font-black text-white mb-3">{meetings.length}</h4>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">Kayıtlı Toplantı</p>
          </div>
        </div>
      </div>
    </div>
  );
}
