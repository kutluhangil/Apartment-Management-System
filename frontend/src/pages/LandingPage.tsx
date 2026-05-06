import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  aidatsApi, expensesApi, meetingsApi, announcementsApi,
  maintenanceApi, settingsApi,
} from '../api';
import { formatCurrency, MONTHS } from '../utils/format';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Aidat { id: number; month: number; year: number; amount: number; }
interface Payment { id: number; apartment_number: number; owner_name: string; room_type: string; amount: number; status: string; }
interface Stats { total: number; paid_count: number; pending_count: number; unpaid_count: number; collected: number; total_expected: number; }
interface Expense { id: number; title: string; amount: number; date: string; }
interface Meeting { id: number; title: string; meeting_type: string; date: string; decisions: string[]; attendee_count: number; }
interface Announcement { id: number; title: string; message: string; date: string; }
interface Maintenance { id: number; maintenance_type: string; next_maintenance_date: string | null; }
interface Settings { iban: string; accountName: string; bankName: string; paymentNoteTemplate: string; }

// ─── Header ─────────────────────────────────────────────────────────────────
function Header() {
  return (
    <header className="flex-shrink-0 h-14 px-4 sm:px-6 flex items-center justify-between bg-black/90 apple-blur border-b border-white/5 z-30">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-black text-base">apartment</span>
        </div>
        <span className="text-[13px] sm:text-sm font-bold tracking-tight text-white">
          Cumhuriyet Apartmanı
        </span>
      </Link>
      <Link
        to="/giris"
        className="flex items-center gap-1.5 text-[12px] sm:text-[13px] font-semibold text-white/60 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-base">lock</span>
        Yönetici Girişi
      </Link>
    </header>
  );
}

// ─── Card wrapper ───────────────────────────────────────────────────────────
function Card({
  className = '',
  gradient,
  children,
  pattern = false,
}: {
  className?: string;
  gradient: string;
  children: React.ReactNode;
  pattern?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl text-white shadow-lg shadow-black/10 transition-all hover:shadow-xl hover:scale-[1.005] ${gradient} ${className}`}
    >
      {pattern && (
        <>
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        </>
      )}
      <div className="relative h-full flex flex-col p-5 sm:p-6">{children}</div>
    </div>
  );
}

function Eyebrow({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-white/70 mb-2">
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {label}
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [aidats, setAidats] = useState<Aidat[]>([]);
  const [activeAidat, setActiveAidat] = useState<Aidat | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [nextMaintenance, setNextMaintenance] = useState<Maintenance | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    aidatsApi.getAll().then(r => {
      setAidats(r.data);
      if (r.data.length > 0) setActiveAidat(r.data[0]);
    }).catch(() => {});
    expensesApi.getSummary().then(r => setSummary(r.data)).catch(() => {});
    expensesApi.getAll({ type: 'expense', limit: 4, page: 1 }).then(r => setRecentExpenses(r.data.expenses || [])).catch(() => {});
    meetingsApi.getAll({ page: 1 }).then(r => {
      const list = r.data.meetings || [];
      if (list.length > 0) setMeeting(list[0]);
    }).catch(() => {});
    announcementsApi.getAll().then(r => {
      if (r.data.length > 0) setAnnouncement(r.data[0]);
    }).catch(() => {});
    maintenanceApi.getAll().then(r => {
      const upcoming = (r.data || [])
        .filter((m: Maintenance) => m.next_maintenance_date)
        .sort((a: Maintenance, b: Maintenance) =>
          new Date(a.next_maintenance_date!).getTime() - new Date(b.next_maintenance_date!).getTime()
        );
      if (upcoming.length > 0) setNextMaintenance(upcoming[0]);
    }).catch(() => {});
    settingsApi.get().then(r => setSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeAidat) return;
    aidatsApi.getPayments(activeAidat.id).then(r => setPayments(r.data || [])).catch(() => {});
    aidatsApi.getStats(activeAidat.id).then(r => setStats(r.data)).catch(() => {});
  }, [activeAidat]);

  const paymentRate = stats && stats.total > 0
    ? Math.round((stats.paid_count / stats.total) * 100)
    : 0;

  const periodLabel = activeAidat
    ? `${MONTHS[activeAidat.month - 1]} ${activeAidat.year}`
    : 'Aidat';

  const maintDays = useMemo(() => {
    if (!nextMaintenance?.next_maintenance_date) return null;
    return Math.floor(
      (new Date(nextMaintenance.next_maintenance_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  }, [nextMaintenance]);

  const copyIban = async () => {
    if (!settings?.iban) return;
    try {
      await navigator.clipboard.writeText(settings.iban.replace(/\s/g, ''));
      toast.success('IBAN kopyalandı');
    } catch {
      toast.error('Kopyalanamadı');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white antialiased overflow-hidden">
      <Header />

      <main className="flex-1 overflow-y-auto lg:overflow-hidden">
        <div className="h-full max-w-[1500px] mx-auto p-3 sm:p-4 lg:p-5">
          {/*
            Bento grid:
            mobile: single column stack (scrollable)
            lg+: 12 col × 6 row, all visible without scroll
          */}
          <div className="lg:h-full grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-6 gap-3 sm:gap-4">

            {/* ── 1. CASH HERO (indigo→purple) ────────────────────── */}
            <Card
              className="lg:col-span-7 lg:row-span-3 min-h-[260px] lg:min-h-0"
              gradient="bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700"
              pattern
            >
              <div className="flex items-start justify-between">
                <Eyebrow icon="account_balance_wallet" label="Apartman Kasası" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 hidden sm:block">
                  Canlı
                </span>
              </div>
              <div className="my-2 lg:my-3">
                <p className="text-[11px] font-semibold text-white/60 mb-1">Net Bakiye</p>
                <p className="text-5xl sm:text-6xl lg:text-7xl xl:text-[88px] font-black tracking-[-0.04em] leading-[0.95]">
                  {formatCurrency(summary.balance)}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-white/15">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-0.5">↑ Gelir</p>
                    <p className="text-sm sm:text-base font-black text-white">
                      {formatCurrency(summary.totalIncome)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-0.5">↓ Gider</p>
                    <p className="text-sm sm:text-base font-black text-white/90">
                      {formatCurrency(summary.totalExpense)}
                    </p>
                  </div>
                </div>
              </div>
              {/* Recent expenses inline */}
              {recentExpenses.length > 0 && (
                <div className="mt-auto bg-white/10 rounded-xl p-2.5 sm:p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">receipt_long</span>
                    Son Harcamalar
                  </p>
                  <div className="space-y-1">
                    {recentExpenses.slice(0, 3).map(e => (
                      <div key={e.id} className="flex items-center justify-between gap-2 text-[12px]">
                        <span className="text-white/80 truncate font-medium">{e.title}</span>
                        <span className="text-white font-black flex-shrink-0">
                          −{formatCurrency(e.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* ── 2. AIDAT STATUS (emerald→teal) ────────────────────── */}
            <Card
              className="lg:col-span-5 lg:row-span-3 min-h-[260px] lg:min-h-0"
              gradient="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600"
              pattern
            >
              <div className="flex items-start justify-between mb-2">
                <Eyebrow icon="payments" label={periodLabel} />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded-full text-white/90">
                  {stats?.total || 18} daire
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] leading-none">
                  {paymentRate}
                </p>
                <p className="text-2xl sm:text-3xl font-black text-white/70">%</p>
              </div>
              <p className="text-[11px] font-semibold text-white/70 mb-3">Tahsilat oranı</p>

              <div className="w-full bg-white/15 rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-700"
                  style={{ width: `${paymentRate}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="bg-white/10 rounded-xl py-2">
                  <p className="text-xl font-black">{stats?.paid_count || 0}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Ödendi</p>
                </div>
                <div className="bg-white/10 rounded-xl py-2">
                  <p className="text-xl font-black">{stats?.pending_count || 0}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Bekliyor</p>
                </div>
                <div className="bg-white/10 rounded-xl py-2">
                  <p className="text-xl font-black">{stats?.unpaid_count || 0}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Ödenmedi</p>
                </div>
              </div>

              {/* 18 daire mini grid */}
              <div className="grid grid-cols-9 gap-1 mt-auto">
                {payments.map(p => {
                  const color = p.status === 'paid' ? 'bg-white' : p.status === 'pending' ? 'bg-amber-300' : 'bg-rose-400';
                  return (
                    <div
                      key={p.id}
                      title={`Daire ${p.apartment_number} — ${p.owner_name}`}
                      className={`aspect-square rounded-md ${color} flex items-center justify-center text-[8px] font-black ${p.status === 'paid' ? 'text-emerald-700' : 'text-black/70'}`}
                    >
                      {p.apartment_number}
                    </div>
                  );
                })}
              </div>

              {/* Period selector — only first 3 */}
              {aidats.length > 1 && (
                <div className="flex gap-1 mt-3 -mb-1 overflow-x-auto">
                  {aidats.slice(0, 4).map(a => (
                    <button
                      key={a.id}
                      onClick={() => setActiveAidat(a)}
                      className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                        activeAidat?.id === a.id
                          ? 'bg-white text-emerald-700'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      {MONTHS[a.month - 1].slice(0, 3)} {a.year}
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* ── 3. LATEST MEETING (sky→blue) ───────────────────── */}
            <Card
              className="lg:col-span-4 lg:row-span-3 min-h-[200px] lg:min-h-0"
              gradient="bg-gradient-to-br from-sky-400 via-blue-500 to-blue-700"
              pattern
            >
              <Eyebrow icon="event_available" label="Son Toplantı" />
              {meeting ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 mb-1.5">
                    {meeting.meeting_type}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mb-2">
                    {meeting.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-white/70 font-medium mb-3">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {new Date(meeting.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">group</span>
                      {meeting.attendee_count}
                    </span>
                  </div>
                  {meeting.decisions && meeting.decisions.length > 0 && (
                    <div className="bg-white/10 rounded-xl p-3 mt-auto">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">
                        Alınan Kararlar
                      </p>
                      <ul className="text-[12px] text-white/95 space-y-1 list-disc list-inside marker:text-white/40 leading-snug">
                        {meeting.decisions.slice(0, 2).map((d, i) => (
                          <li key={i} className="line-clamp-2">{d}</li>
                        ))}
                      </ul>
                      {meeting.decisions.length > 2 && (
                        <p className="text-[10px] text-white/50 mt-1.5">+{meeting.decisions.length - 2} karar daha</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-white/60 text-sm m-auto">Henüz toplantı kaydı yok.</p>
              )}
            </Card>

            {/* ── 4. ANNOUNCEMENT (pink→rose) ────────────────────── */}
            <Card
              className="lg:col-span-4 lg:row-span-3 min-h-[200px] lg:min-h-0"
              gradient="bg-gradient-to-br from-pink-500 via-rose-500 to-red-600"
              pattern
            >
              <Eyebrow icon="campaign" label="Son Duyuru" />
              {announcement ? (
                <>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mb-2">
                    {announcement.title}
                  </h3>
                  <p className="text-[11px] text-white/60 font-semibold mb-3">
                    {new Date(announcement.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <div className="bg-white/10 rounded-xl p-3 flex-1 overflow-hidden">
                    <p className="text-[12.5px] text-white/95 leading-relaxed line-clamp-[7] whitespace-pre-wrap">
                      {announcement.message}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-white/60 text-sm m-auto">Şu an aktif duyuru yok.</p>
              )}
            </Card>

            {/* ── 5. IBAN + BAKIM combined (amber→orange) ────────── */}
            <Card
              className="lg:col-span-4 lg:row-span-3 min-h-[200px] lg:min-h-0"
              gradient="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500"
              pattern
            >
              <Eyebrow icon="qr_code_2" label="Aidat Ödeme" />
              <div className="bg-white/15 rounded-xl p-3 mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">IBAN</p>
                <p className="text-[13px] sm:text-sm font-mono font-bold text-white tracking-tight break-all leading-snug">
                  {settings?.iban || 'TR00 0000 0000 0000 0000 0000 00'}
                </p>
                <p className="text-[10px] text-white/70 mt-1.5">{settings?.accountName}</p>
              </div>
              <button
                onClick={copyIban}
                className="w-full bg-white text-orange-700 font-bold text-sm py-2.5 rounded-xl hover:bg-white/95 transition-all flex items-center justify-center gap-1.5 mb-3"
              >
                <span className="material-symbols-outlined text-base">content_copy</span>
                IBAN'ı Kopyala
              </button>

              {/* Next maintenance mini */}
              {nextMaintenance && (
                <div className="bg-white/10 rounded-xl p-3 mt-auto">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">handyman</span>
                      Yaklaşan Bakım
                    </p>
                    {maintDays !== null && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        maintDays < 0 ? 'bg-rose-500 text-white' :
                          maintDays <= 7 ? 'bg-yellow-200 text-orange-900' :
                            'bg-white/15 text-white'
                      }`}>
                        {maintDays < 0 ? 'Gecikmiş' : `${maintDays} gün`}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] font-bold text-white truncate">{nextMaintenance.maintenance_type}</p>
                  <p className="text-[11px] text-white/70 mt-0.5">
                    {nextMaintenance.next_maintenance_date
                      ? new Date(nextMaintenance.next_maintenance_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
              )}
            </Card>

          </div>
        </div>
      </main>

      {/* Footer — minimal */}
      <footer className="flex-shrink-0 px-4 sm:px-6 py-2.5 border-t border-white/5 bg-black/95 text-[10px] sm:text-[11px] text-white/40 flex justify-between items-center">
        <span>© {new Date().getFullYear()} Cumhuriyet Apartmanı</span>
        <span className="hidden sm:inline">Şeffaf yönetim · Dijital takip</span>
        <span>Kutluhan Gül</span>
      </footer>
    </div>
  );
}
