import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { timelineApi } from '../api';
import Navbar from '../components/public/Navbar';
import { formatCurrency } from '../utils/format';

interface TimelineEntry {
  id: number;
  year: number;
  title: string;
  description?: string;
  image_path?: string;
  income: number;
  total_expense: number;
  maintenance_note: string;
  icon: string;
}

const STATS = [
  { number: '18', label: 'Daire', icon: 'apartment' },
  { number: '6',  label: 'Kat',   icon: 'stairs' },
  { number: '2024', label: 'Kuruluş', icon: 'calendar_today' },
  { number: '%100', label: 'Şeffaflık', icon: 'verified', dark: true },
];

const MARQUEE_ITEMS = [
  '18 Daire', '6 Kat', 'Şeffaf Yönetim', 'Güvenli Yaşam',
  'Dijital Yönetim', 'Finansal Şeffaflık', '7/24 Erişim', 'Güvenilir Komşuluk',
];

const FEATURES = [
  {
    icon: 'account_balance_wallet',
    title: 'Finansal Şeffaflık',
    desc: 'Tüm gelir ve gider kayıtları, aidat tahsilatları ve fatura detaylarına anlık erişim.',
    link: '/finansal',
    linkLabel: 'Kayıtları İncele',
    dark: false,
  },
  {
    icon: 'event_available',
    title: 'Toplantı Arşivi',
    desc: 'Genel kurul ve yönetim toplantılarının resmi tutanakları, kararlar ve katılım bilgileri.',
    link: '/toplanti-notlari',
    linkLabel: 'Toplantılara Bak',
    dark: false,
  },
  {
    icon: 'shield_lock',
    title: 'Güvenli Yönetim',
    desc: 'Sakinlere özel portal ile duyurular, belgeler ve bakım takibine güvenli erişim.',
    link: '/giris',
    linkLabel: 'Giriş Yap',
    dark: true,
  },
];

export default function LandingPage() {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    timelineApi.getAll().then(r => setTimeline(r.data)).catch(() => {});
  }, []);

  const marqueeItems = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="min-h-screen bg-[#fafaf9] font-display">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="min-h-[calc(100vh-4rem)] flex items-center px-5 sm:px-8 md:px-12 lg:px-20 py-16">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — Text */}
          <div className="fade-in-up order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-8">
              <span className="w-6 h-px bg-slate-300 inline-block" />
              Ankara · Est. 2024
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-[#111] leading-[0.95] mb-6">
              Cumhuriyet<br />
              <span className="text-slate-300">Apartmanı</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 mb-10 max-w-md leading-relaxed">
              Modern yaşam standartları ile köklü değerlerin buluştuğu adres.
              Şeffaf yönetim, güvenilir komşuluk.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#tarihce"
                className="bg-[#111] text-white px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#333] transition-colors"
              >
                Apartmanı Keşfet
              </a>
              <Link
                to="/finansal"
                className="border border-slate-200 text-[#111] px-7 py-3.5 rounded-full text-sm font-bold hover:bg-slate-100 transition-colors"
              >
                Finansal Rapor
              </Link>
            </div>
          </div>

          {/* Right — Stats Grid */}
          <div className="order-1 lg:order-2 grid grid-cols-2 gap-3 sm:gap-4 fade-in">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl sm:rounded-3xl p-6 sm:p-8 ${
                  stat.dark
                    ? 'bg-[#111] text-white'
                    : 'bg-white border border-slate-100 shadow-sm'
                }`}
              >
                <span className={`material-symbols-outlined text-xl sm:text-2xl mb-3 block ${stat.dark ? 'text-white/40' : 'text-slate-200'}`}>
                  {stat.icon}
                </span>
                <div className={`text-3xl sm:text-4xl font-black tracking-tight mb-1 ${stat.dark ? 'text-white' : 'text-[#111]'}`}>
                  {stat.number}
                </div>
                <div className={`text-xs sm:text-sm font-medium ${stat.dark ? 'text-white/50' : 'text-slate-400'}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE BAR ────────────────────────────────────────────────────── */}
      <div className="bg-[#111] text-white py-4 overflow-hidden select-none">
        <div className="marquee-track">
          {marqueeItems.map((text, i) => (
            <span key={i} className="flex items-center gap-6 sm:gap-10 px-4 sm:px-6 text-xs sm:text-sm font-bold uppercase tracking-[0.15em] text-white/50">
              {text}
              <span className="text-white/20">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-5 sm:px-8 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#111] mb-4 leading-tight">
              Dijital Yönetimin<br className="hidden sm:block" />
              Tüm İmkânları
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-md">
              Apartmanınızın her detayına tek bir platformdan ulaşın.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map(card => (
              <div
                key={card.title}
                className={`rounded-2xl sm:rounded-3xl p-7 sm:p-9 flex flex-col gap-6 ${
                  card.dark ? 'bg-[#111]' : 'bg-white border border-slate-100 shadow-sm'
                }`}
              >
                <span className={`material-symbols-outlined text-2xl sm:text-3xl ${card.dark ? 'text-white/40' : 'text-slate-200'}`}>
                  {card.icon}
                </span>
                <div className="flex-1">
                  <h3 className={`text-lg sm:text-xl font-bold mb-2 sm:mb-3 ${card.dark ? 'text-white' : 'text-[#111]'}`}>
                    {card.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${card.dark ? 'text-white/50' : 'text-slate-500'}`}>
                    {card.desc}
                  </p>
                </div>
                <Link
                  to={card.link}
                  className={`inline-flex items-center gap-1.5 text-sm font-bold transition-opacity hover:opacity-60 ${card.dark ? 'text-white' : 'text-[#111]'}`}
                >
                  {card.linkLabel}
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ───────────────────────────────────────────────────────── */}
      {timeline.length > 0 && (
        <section className="py-20 sm:py-24 bg-white px-5 sm:px-8 md:px-12 lg:px-20" id="tarihce">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#111] mb-4">
                Apartman Tarihçesi
              </h2>
              <p className="text-slate-500 text-sm sm:text-base">Yıllar içindeki dönüşüm ve gelişimimiz</p>
            </div>

            <div className="relative">
              <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-px bg-slate-100" />
              <div className="space-y-8 sm:space-y-10">
                {timeline.map(entry => (
                  <div key={entry.id} className="relative pl-12 sm:pl-14">
                    <div className="absolute left-[8px] sm:left-[10px] top-2 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#111] ring-4 ring-white" />
                    <div className="bg-[#fafaf9] border border-slate-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
                      <div className="flex flex-wrap items-baseline gap-3 mb-3">
                        <span className="text-2xl sm:text-3xl font-black text-[#111]">{entry.year}</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">{entry.title}</span>
                      </div>
                      {entry.description && (
                        <p className="text-slate-500 text-sm mb-4 leading-relaxed">{entry.description}</p>
                      )}
                      {entry.image_path && (
                        <img
                          src={`/api${entry.image_path}`}
                          alt={entry.title}
                          className="w-full h-40 sm:h-48 object-cover rounded-xl mb-4"
                        />
                      )}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {entry.income > 0 && (
                          <span className="text-emerald-600 font-semibold">↑ {formatCurrency(entry.income)}</span>
                        )}
                        {entry.total_expense > 0 && (
                          <span className="text-red-500 font-semibold">↓ {formatCurrency(entry.total_expense)}</span>
                        )}
                        {entry.maintenance_note && entry.maintenance_note !== 'Yok' && (
                          <span className="text-slate-400 font-medium">Bakım: {entry.maintenance_note}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── FINANCE CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-5 sm:px-8 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#111] rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Şeffaf Yönetim</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 leading-tight">
                Tüm finansal kayıtlar<br className="hidden sm:block" />herkese açık.
              </h2>
              <p className="text-white/40 text-sm max-w-md leading-relaxed">
                Aidat gelirleri, ortak alan giderleri, faturalar — her şey gerçek zamanlı ve şeffaf.
              </p>
            </div>
            <Link
              to="/finansal"
              className="flex-shrink-0 bg-white text-[#111] px-7 py-4 rounded-full text-sm font-bold hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Kayıtları İncele
            </Link>
          </div>
        </div>
      </section>

      {/* ── MEETINGS ───────────────────────────────────────────────────────── */}
      <section className="pb-20 sm:pb-24 px-5 sm:px-8 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#111] leading-tight">
              Toplantı<br />Kayıtları
            </h2>
            <Link
              to="/toplanti-notlari"
              className="text-sm font-bold text-slate-400 hover:text-[#111] transition-colors whitespace-nowrap"
            >
              Tümünü Gör →
            </Link>
          </div>

          <Link
            to="/toplanti-notlari"
            className="group flex items-center justify-between p-6 sm:p-8 bg-white border border-slate-100 rounded-2xl sm:rounded-3xl hover:border-[#111]/20 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-[#111] transition-colors flex-shrink-0">
                <span className="material-symbols-outlined text-slate-300 group-hover:text-white transition-colors">event_available</span>
              </div>
              <div>
                <h3 className="font-bold text-[#111] text-sm sm:text-base">Toplantı Notlarını Görüntüle</h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Resmi kararlar, gündem ve katılım kayıtları</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-200 group-hover:text-[#111] transition-colors flex-shrink-0 ml-4">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-10 sm:py-12 px-5 sm:px-8 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#111] text-xl">apartment</span>
            <span className="text-sm font-bold text-[#111]">Cumhuriyet Apartmanı</span>
          </Link>

          <div className="flex gap-5 sm:gap-7 text-sm text-slate-400">
            <Link to="/toplanti-notlari" className="hover:text-[#111] transition-colors">Toplantılar</Link>
            <Link to="/finansal" className="hover:text-[#111] transition-colors">Finansal</Link>
            <Link to="/giris" className="hover:text-[#111] transition-colors">Giriş Yap</Link>
          </div>

          <span className="text-xs text-slate-300 font-medium">
            Kutluhan Gül · 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
