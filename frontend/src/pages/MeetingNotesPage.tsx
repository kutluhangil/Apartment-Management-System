import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { meetingsApi } from '../api';
import Navbar from '../components/public/Navbar';

interface Meeting {
  id: number;
  title: string;
  meeting_type: string;
  date: string;
  time: string;
  notes: string;
  decisions: string[];
  attendee_count: number;
  status: string;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Tamamlandı', cls: 'bg-green-100 text-green-700' },
  info: { label: 'Bilgi', cls: 'bg-blue-100 text-blue-700' },
  important: { label: 'Önemli', cls: 'bg-amber-100 text-amber-700' },
  archived: { label: 'Arşiv', cls: 'bg-gray-100 text-gray-700' },
  planned: { label: 'Planlandı', cls: 'bg-slate-100 text-slate-700' },
};

export default function MeetingNotesPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchMeetings = () => {
    setLoading(true);
    meetingsApi.getAll({ year: activeYear === 'all' ? undefined : activeYear, page })
      .then(r => {
        setMeetings(r.data.meetings);
        setTotal(r.data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMeetings(); }, [activeYear, page]);

  const years = ['all', '2024', '2023'];

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 lg:px-10 py-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-primary dark:text-white mb-2">Toplantı Notları</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">Yönetim ve kurul toplantılarının resmi kayıtları, alınan kararlar ve katılım detayları.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-8 border-b border-primary/10 overflow-x-auto">
          {years.map(y => (
            <button
              key={y}
              onClick={() => { setActiveYear(y); setPage(1); }}
              className={`px-5 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeYear === y
                  ? 'border-primary text-primary dark:text-white font-bold'
                  : 'border-transparent text-primary/50 dark:text-slate-500 hover:text-primary'
              }`}
            >
              {y === 'all' ? 'Tümü' : y}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-primary/5 p-6 animate-pulse h-64" />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-16 text-slate-500">Toplantı kaydı bulunamadı.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {meetings.map(m => {
              const s = statusConfig[m.status] || statusConfig.archived;
              return (
                <div key={m.id} className="bg-white dark:bg-white/5 rounded-xl border border-primary/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-1 block">{m.meeting_type}</span>
                      <h3 className="text-xl font-bold text-primary dark:text-white">{m.title}</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase flex-shrink-0 ${s.cls}`}>{s.label}</span>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-5">
                    <div className="flex items-center gap-1.5 text-primary/60 dark:text-slate-400">
                      <span className="material-symbols-outlined text-lg">calendar_today</span>
                      <span className="text-sm">{new Date(m.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    {m.time && (
                      <div className="flex items-center gap-1.5 text-primary/60 dark:text-slate-400">
                        <span className="material-symbols-outlined text-lg">schedule</span>
                        <span className="text-sm">{m.time}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-primary/60 dark:text-slate-400">
                      <span className="material-symbols-outlined text-lg">group</span>
                      <span className="text-sm">{m.attendee_count} Daire</span>
                    </div>
                  </div>

                  {m.notes && (
                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-primary/40 uppercase mb-2">Toplantı Notları</h4>
                      <p className="text-sm text-primary/80 dark:text-slate-300 leading-relaxed">{m.notes}</p>
                    </div>
                  )}

                  {m.decisions && m.decisions.length > 0 && (
                    <div className="bg-primary/5 dark:bg-white/5 p-4 rounded-lg">
                      <h4 className="text-xs font-bold text-primary/40 uppercase mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">task_alt</span> Alınan Kararlar
                      </h4>
                      <ul className="text-sm text-primary/80 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                        {m.decisions.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {total > 20 && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-2 text-sm font-bold text-primary/60 hover:text-primary transition-colors py-3 px-8 rounded-full border border-primary/10 hover:bg-primary/5"
            >
              Daha Fazla Göster <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-primary/10 py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary/40">© {new Date().getFullYear()} Cumhuriyet Apartmanı Yönetimi</p>
          <div className="flex gap-6">
            <Link to="/" className="text-sm text-primary/40 hover:text-primary">Ana Sayfa</Link>
            <Link to="/finansal" className="text-sm text-primary/40 hover:text-primary">Finansal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
