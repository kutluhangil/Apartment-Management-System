import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  aidatsApi,
  expensesApi,
  meetingsApi,
  announcementsApi,
  maintenanceApi,
  apartmentsApi,
  analyticsApi,
  timelineApi,
} from '../api';
import { formatCurrency, MONTHS } from '../utils/format';
import { meetingStatusConfig } from '../utils/meetings';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import InvoicePreviewModal from '../components/ui/InvoicePreviewModal';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Aidat { id: number; month: number; year: number; amount: number; }
interface Payment { id: number; apartment_number: number; owner_name: string; room_type: string; amount: number; status: string; paid_at: string | null; note: string | null; }
interface Stats { total: number; paid_count: number; pending_count: number; unpaid_count: number; collected: number; total_expected: number; }
interface Expense { id: number; title: string; description: string; amount: number; type: string; date: string; invoice_path: string | null; }
interface Meeting { id: number; title: string; meeting_type: string; date: string; time: string | null; notes: string | null; decisions: string[]; attendee_count: number; status: string; }
interface Announcement { id: number; title: string; message: string; date: string; }
interface Maintenance { id: number; maintenance_type: string; description: string | null; last_maintenance_date: string | null; next_maintenance_date: string | null; }
interface Apartment { id: number; number: number; owner_name: string; floor: number; profession: string | null; room_type: string; }
interface TimelineEntry { id: number; year: number; title: string; description?: string; income: number; total_expense: number; maintenance_note: string; icon: string; }

const STATUS_DOT: Record<string, { color: string; label: string; ring: string }> = {
  paid: { color: 'bg-emerald-500', label: 'Ödendi', ring: 'ring-emerald-100' },
  pending: { color: 'bg-amber-500', label: 'Bekliyor', ring: 'ring-amber-100' },
  unpaid: { color: 'bg-rose-500', label: 'Ödenmedi', ring: 'ring-rose-100' },
};

// ─── Sticky minimal header ─────────────────────────────────────────────────
function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 apple-blur ${
        scrolled ? 'bg-white/80 border-b border-slate-200/60' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto h-14 px-5 sm:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#111] text-xl">apartment</span>
          <span className="text-[13px] sm:text-sm font-semibold tracking-tight text-[#111]">
            Cumhuriyet Apt.
          </span>
        </Link>
        <Link
          to="/giris"
          className="text-[13px] font-semibold text-slate-500 hover:text-[#111] transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">lock</span>
          Yönetici Girişi
        </Link>
      </div>
    </header>
  );
}

// ─── Section helper ─────────────────────────────────────────────────────────
function Section({
  id, eyebrow, title, subtitle, dark = false, children,
}: {
  id?: string; eyebrow?: string; title: string; subtitle?: string; dark?: boolean; children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`px-5 sm:px-8 lg:px-12 py-16 sm:py-24 ${
        dark ? 'bg-[#111] text-white' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 sm:mb-14">
          {eyebrow && (
            <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-3 ${dark ? 'text-white/40' : 'text-slate-400'}`}>
              {eyebrow}
            </p>
          )}
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.05] ${dark ? 'text-white' : 'text-[#111]'}`}>
            {title}
          </h2>
          {subtitle && (
            <p className={`mt-4 max-w-xl text-sm sm:text-base leading-relaxed ${dark ? 'text-white/50' : 'text-slate-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

// ─── Stat tile ─────────────────────────────────────────────────────────────
function StatTile({ label, value, accent }: { label: string; value: string; accent?: 'pos' | 'neg' | 'neutral' | 'dark' }) {
  const color =
    accent === 'pos' ? 'text-emerald-600'
      : accent === 'neg' ? 'text-rose-600'
        : accent === 'dark' ? 'text-white'
          : 'text-[#111]';
  const bg = accent === 'dark' ? 'bg-[#111] border-transparent' : 'bg-white border-slate-100';
  const labelColor = accent === 'dark' ? 'text-white/50' : 'text-slate-400';
  return (
    <div className={`rounded-2xl border ${bg} p-5 sm:p-6`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${labelColor}`}>{label}</p>
      <p className={`text-2xl sm:text-3xl font-black tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function LandingPage() {
  const [aidats, setAidats] = useState<Aidat[]>([]);
  const [activeAidat, setActiveAidat] = useState<Aidat | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [analytics, setAnalytics] = useState<{ monthlyData: { name: string; income: number; expense: number }[] } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    aidatsApi.getAll().then(r => {
      setAidats(r.data);
      if (r.data.length > 0) {
        const first = r.data[0];
        setActiveAidat(first);
      }
    }).catch(() => {});
    expensesApi.getSummary().then(r => setSummary(r.data)).catch(() => {});
    expensesApi.getAll({ type: 'expense', limit: 8, page: 1 }).then(r => setRecentExpenses(r.data.expenses || [])).catch(() => {});
    meetingsApi.getAll({ page: 1 }).then(r => setMeetings((r.data.meetings || []).slice(0, 4))).catch(() => {});
    announcementsApi.getAll().then(r => setAnnouncements(r.data || [])).catch(() => {});
    maintenanceApi.getAll().then(r => setMaintenance(r.data || [])).catch(() => {});
    apartmentsApi.getAll().then(r => setApartments(r.data || [])).catch(() => {});
    timelineApi.getAll().then(r => setTimeline(r.data || [])).catch(() => {});
    analyticsApi.getDashboardStats().then(r => setAnalytics(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeAidat) return;
    aidatsApi.getPayments(activeAidat.id).then(r => setPayments(r.data || [])).catch(() => {});
    aidatsApi.getStats(activeAidat.id).then(r => setStats(r.data)).catch(() => {});
  }, [activeAidat]);

  const upcomingMaintenance = useMemo(() => {
    return [...maintenance]
      .filter(m => m.next_maintenance_date)
      .sort((a, b) =>
        new Date(a.next_maintenance_date!).getTime() - new Date(b.next_maintenance_date!).getTime()
      )
      .slice(0, 6);
  }, [maintenance]);

  const paymentRate = stats && stats.total > 0
    ? Math.round((stats.paid_count / stats.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#111] antialiased">
      <PublicHeader />

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative px-5 sm:px-8 lg:px-12 pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-slate-400 mb-5 sm:mb-7 fade-in-up">
            Ankara · Est. 2024
          </p>
          <h1 className="text-[44px] leading-[1] sm:text-7xl md:text-8xl font-black tracking-tight text-[#111] mb-6 sm:mb-8 fade-in-up">
            Cumhuriyet
            <br />
            <span className="text-slate-300">Apartmanı</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 max-w-xl leading-relaxed mb-10 sm:mb-12 fade-in-up">
            Şeffaf yönetim. Dijital takip. Tüm aidat, gider ve toplantı bilgilerinize tek bir sayfadan erişin.
          </p>

          {/* Live snapshot stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 fade-in">
            <StatTile label="Net Kasa" value={formatCurrency(summary.balance)} accent="dark" />
            <StatTile label="Toplam Gelir" value={formatCurrency(summary.totalIncome)} accent="pos" />
            <StatTile label="Toplam Gider" value={formatCurrency(summary.totalExpense)} accent="neg" />
            <StatTile label="Tahsilat" value={`${paymentRate}%`} accent="neutral" />
          </div>
        </div>
      </section>

      {/* ── AIDAT DURUMU ──────────────────────────────────────────────── */}
      <Section
        id="aidat"
        eyebrow="Bu Ayın Aidatı"
        title={
          activeAidat
            ? `${MONTHS[activeAidat.month - 1]} ${activeAidat.year}`
            : 'Aidat Dönemleri'
        }
        subtitle="Her dairenin ödeme durumu canlı ve şeffaftır. Ay seçerek geçmiş dönemleri inceleyebilirsiniz."
      >
        {/* Period selector */}
        {aidats.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-8 -mx-5 px-5 sm:mx-0 sm:px-0">
            {aidats.slice(0, 12).map(a => (
              <button
                key={a.id}
                onClick={() => setActiveAidat(a)}
                className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-colors ${
                  activeAidat?.id === a.id
                    ? 'bg-[#111] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {MONTHS[a.month - 1]} {a.year}
              </button>
            ))}
          </div>
        )}

        {/* Tahsilat progress + counts */}
        {stats && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tahsilat Oranı</p>
                <p className="text-4xl sm:text-5xl font-black text-[#111] tracking-tight">{paymentRate}%</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Toplanan</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                  {formatCurrency(stats.collected)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  / {formatCurrency(stats.total_expected)} bekleniyor
                </p>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#111] h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${paymentRate}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600">{stats.paid_count}</p>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-1">Ödendi</p>
              </div>
              <div className="text-center border-x border-slate-100">
                <p className="text-2xl font-black text-amber-600">{stats.pending_count}</p>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-1">Bekliyor</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-rose-600">{stats.unpaid_count}</p>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-1">Ödenmedi</p>
              </div>
            </div>
          </div>
        )}

        {/* 18 daire grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {payments.map(p => {
            const s = STATUS_DOT[p.status] || STATUS_DOT.unpaid;
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-100 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2 hover:border-slate-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Daire {String(p.apartment_number).padStart(2, '0')}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${s.color} ring-4 ${s.ring}`} />
                </div>
                <p className="text-sm font-bold text-[#111] truncate" title={p.owner_name}>
                  {p.owner_name}
                </p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`px-1.5 py-0.5 rounded font-bold ${
                    p.room_type === '3+1' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                  }`}>
                    {p.room_type}
                  </span>
                  <span className="font-semibold text-slate-500">{formatCurrency(p.amount)}</span>
                </div>
                <p className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${
                  p.status === 'paid' ? 'text-emerald-600' : p.status === 'pending' ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {s.label}
                </p>
              </div>
            );
          })}
          {payments.length === 0 && (
            <p className="col-span-full text-center text-slate-400 text-sm py-12">
              Henüz aidat dönemi oluşturulmamış.
            </p>
          )}
        </div>
      </Section>

      {/* ── FİNANSAL DETAY ─────────────────────────────────────────────── */}
      <Section
        id="finansal"
        eyebrow="Finansal Şeffaflık"
        title="Aylık Gelir & Gider"
        subtitle="Yıl boyunca tahakkuk eden aidat gelirleri ile yapılan harcamaların grafiği."
      >
        <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-8">
          <div className="h-64 sm:h-72">
            {analytics?.monthlyData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="income" name="Gelir" fill="#10B981" radius={[6, 6, 0, 0]} barSize={14} />
                  <Bar dataKey="expense" name="Gider" fill="#F43F5E" radius={[6, 6, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">Yükleniyor…</div>
            )}
          </div>
          <div className="flex items-center gap-5 mt-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Gelir</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Gider</span>
          </div>
        </div>

        {/* Recent expenses */}
        <div className="mt-10 sm:mt-12">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg sm:text-xl font-bold text-[#111]">Son Harcamalar</h3>
            <span className="text-xs font-semibold text-slate-400">{recentExpenses.length} kayıt</span>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
            {recentExpenses.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-12">Henüz harcama kaydı yok.</p>
            ) : recentExpenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#111] truncate">{exp.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(exp.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-black text-rose-600">−{formatCurrency(exp.amount)}</span>
                  {exp.invoice_path && (
                    <button
                      onClick={() => setPreviewUrl(`/uploads/${exp.invoice_path}`)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#111] hover:text-white transition-all"
                      title="Faturayı gör"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── DUYURULAR ──────────────────────────────────────────────────── */}
      {announcements.length > 0 && (
        <Section
          id="duyurular"
          eyebrow="Bildirimler"
          title="Apartman Duyuruları"
          subtitle="Yönetim tarafından paylaşılan en güncel duyurular."
          dark
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.slice(0, 6).map(ann => (
              <div key={ann.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-7 backdrop-blur-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-lg font-bold text-white leading-tight">{ann.title}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 bg-white/5 px-2 py-1 rounded whitespace-nowrap">
                    {new Date(ann.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{ann.message}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── TOPLANTILAR ────────────────────────────────────────────────── */}
      <Section
        id="toplantilar"
        eyebrow="Karar Defteri"
        title="Son Toplantılar"
        subtitle="Genel kurul ve yönetim toplantılarının resmi kararları."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {meetings.length === 0 ? (
            <p className="col-span-full text-center text-slate-400 text-sm py-12">Henüz toplantı kaydı yok.</p>
          ) : meetings.map(m => {
            const s = meetingStatusConfig[m.status] || meetingStatusConfig.archived;
            return (
              <div key={m.id} className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5">
                      {m.meeting_type}
                    </p>
                    <h3 className="text-lg font-bold text-[#111] leading-tight">{m.title}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap ${s.cls}`}>
                    {s.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    {new Date(m.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {m.time && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {m.time}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">group</span>
                    {m.attendee_count} daire
                  </span>
                </div>
                {m.notes && (
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{m.notes}</p>
                )}
                {m.decisions && m.decisions.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">task_alt</span> Alınan Kararlar
                    </p>
                    <ul className="text-sm text-slate-700 space-y-1.5 list-disc list-inside marker:text-slate-300">
                      {m.decisions.map((d, i) => <li key={i} className="leading-relaxed">{d}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── BAKIM ──────────────────────────────────────────────────────── */}
      {upcomingMaintenance.length > 0 && (
        <Section
          id="bakim"
          eyebrow="Periyodik Hizmetler"
          title="Yaklaşan Bakımlar"
          subtitle="Asansör, kazan ve diğer periyodik bakımların güncel durumu."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingMaintenance.map(m => {
              const days = m.next_maintenance_date
                ? Math.floor((new Date(m.next_maintenance_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;
              const status =
                days === null ? null
                  : days < 0 ? { label: 'Gecikmiş', cls: 'bg-rose-50 text-rose-600' }
                    : days <= 7 ? { label: `${days} gün`, cls: 'bg-amber-50 text-amber-600' }
                      : { label: 'Planlı', cls: 'bg-emerald-50 text-emerald-600' };
              return (
                <div key={m.id} className="bg-white border border-slate-100 rounded-3xl p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-xl">handyman</span>
                    </div>
                    {status && (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${status.cls}`}>
                        {status.label}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[#111] mb-1.5 line-clamp-2">{m.maintenance_type}</h3>
                  {m.description && (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{m.description}</p>
                  )}
                  <div className="border-t border-slate-100 pt-3 mt-auto space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Son Bakım</span>
                      <span className="font-semibold text-slate-700">
                        {m.last_maintenance_date ? new Date(m.last_maintenance_date).toLocaleDateString('tr-TR') : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sonraki</span>
                      <span className="font-bold text-[#111]">
                        {m.next_maintenance_date ? new Date(m.next_maintenance_date).toLocaleDateString('tr-TR') : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── DAİRELER ──────────────────────────────────────────────────── */}
      {apartments.length > 0 && (
        <Section
          id="daireler"
          eyebrow="Komşuluk"
          title={`${apartments.length} Daire, 6 Kat`}
          subtitle="Apartmanımızdaki tüm dairelerin sahip ve daire tipi bilgileri."
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {apartments.map(a => (
              <div key={a.id} className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-slate-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-black text-[#111] tracking-tight">
                    {String(a.number).padStart(2, '0')}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    a.room_type === '3+1' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                  }`}>
                    {a.room_type}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#111] truncate" title={a.owner_name}>
                  {a.owner_name}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {a.profession || `Kat ${a.floor}`}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── TARİHÇE ────────────────────────────────────────────────────── */}
      {timeline.length > 0 && (
        <Section
          id="tarihce"
          eyebrow="Yıllar İçinde"
          title="Apartmanın Tarihçesi"
          subtitle="2024'ten bugüne hayata geçen yenileme ve bakım çalışmaları."
        >
          <div className="relative pl-6 sm:pl-8">
            <div className="absolute left-1.5 sm:left-2 top-1 bottom-1 w-px bg-slate-200" />
            <div className="space-y-7 sm:space-y-9">
              {timeline.map(entry => (
                <div key={entry.id} className="relative">
                  <div className="absolute -left-[22px] sm:-left-[26px] top-1.5 w-3 h-3 rounded-full bg-[#111] ring-4 ring-[#fafaf9]" />
                  <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-2">
                    <span className="text-2xl sm:text-3xl font-black text-[#111] tracking-tight">{entry.year}</span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{entry.title}</span>
                  </div>
                  {entry.description && (
                    <p className="text-sm text-slate-600 leading-relaxed mb-3 max-w-2xl">{entry.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs">
                    {entry.income > 0 && <span className="text-emerald-600 font-bold">↑ {formatCurrency(entry.income)}</span>}
                    {entry.total_expense > 0 && <span className="text-rose-600 font-bold">↓ {formatCurrency(entry.total_expense)}</span>}
                    {entry.maintenance_note && entry.maintenance_note !== 'Yok' && (
                      <span className="text-slate-400 font-medium">· {entry.maintenance_note}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/60 px-5 sm:px-8 lg:px-12 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#111] text-lg">apartment</span>
            <span className="text-sm font-semibold text-[#111]">Cumhuriyet Apartmanı</span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} · Kutluhan Gül tarafından geliştirildi
          </p>
          <Link to="/giris" className="text-xs font-semibold text-slate-400 hover:text-[#111] transition-colors">
            Yönetici Girişi →
          </Link>
        </div>
      </footer>

      {previewUrl && <InvoicePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
    </div>
  );
}
