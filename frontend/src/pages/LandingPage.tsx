import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { timelineApi } from '../api';
import Navbar from '../components/public/Navbar';

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

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);

export default function LandingPage() {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  useEffect(() => {
    timelineApi.getAll().then(r => setTimeline(r.data)).catch(() => {
      setTimeline([
        { id: 1, year: 2024, title: 'İnşaat Tamamlandı', description: 'Apartman yapım aşaması ve iskan.', income: 0, total_expense: 5000000, maintenance_note: 'Yok', icon: 'foundation' },
        { id: 2, year: 2025, title: 'Bakım İyileştirmeleri', description: 'Dış cephe yenileme.', income: 200000, total_expense: 50000, maintenance_note: 'Boya ve Çatı', icon: 'architecture' },
        { id: 3, year: 2026, title: 'Mevcut Finansal Durum', description: 'Yeni yönetim devri.', income: 100000, total_expense: 20000, maintenance_note: 'Bahçe Düzenleme', icon: 'account_balance_wallet' },
      ]);
    });
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-light dark:to-background-dark z-10" />
          <div
            className="w-full h-full bg-cover bg-center opacity-30 dark:opacity-20"
            style={{ backgroundImage: "url('/hero.jpg')" }}
          />
        </div>
        <div className="relative z-20 text-center max-w-4xl mx-auto fade-in-up">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-primary to-primary/60 dark:from-slate-100 dark:to-slate-400">
            Cumhuriyet<br />Apartmanı
          </h1>
          <p className="text-lg md:text-2xl font-light text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
            Modern yaşamın köklü adresi. Geleceği geçmişin tecrübesiyle inşa ediyoruz.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="#tarihce" className="bg-primary text-white px-7 py-3.5 rounded-full text-base font-semibold hover:scale-105 transition-transform">
              Keşfedin
            </a>
            <Link to="/finansal" className="bg-primary/10 text-primary dark:text-slate-200 px-7 py-3.5 rounded-full text-base font-semibold hover:bg-primary/20 transition-colors">
              Finansal Şeffaflık
            </Link>
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full" id="tarihce">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">Apartman Gelişimi</h2>
          <p className="text-slate-500 dark:text-slate-400">Yıllara göre finansal ve yapısal dönüşüm hikayemiz</p>
        </div>
        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary/10 -translate-y-1/2 hidden md:block" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {timeline.map((entry, idx) => {
              const isLatest = idx === timeline.length - 1;
              return (
                <div key={entry.id} className="group">
                  <div className={`p-8 rounded-2xl hover:-translate-y-2 transition-all duration-300 ${
                    isLatest
                      ? 'border-2 border-primary bg-white dark:bg-primary/10 shadow-xl'
                      : 'border border-primary/10 bg-white dark:bg-primary/5 hover:shadow-2xl'
                  }`}>
                    <div className="flex items-center gap-3 mb-5">
                      <span className={`text-4xl font-black ${isLatest ? 'text-primary' : 'text-primary/20 group-hover:text-primary transition-colors'}`}>
                        {entry.year}
                      </span>
                      <span className="material-symbols-outlined text-primary">{entry.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-4">{entry.title}</h3>
                    {entry.image_path && (
                      <div className="w-full h-32 rounded-lg mb-4 overflow-hidden border border-slate-100 dark:border-slate-800">
                        <img src={`/api${entry.image_path}`} alt={entry.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    {entry.description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{entry.description}</p>}
                    <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between border-b border-primary/5 pb-2">
                        <span>Gelir:</span>
                        <span className={`font-semibold ${entry.income > 0 ? 'text-green-600' : ''}`}>
                          {entry.income > 0 ? formatCurrency(entry.income) : '0 ₺'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-primary/5 pb-2">
                        <span>Gider:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(entry.total_expense)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bakım:</span>
                        <span className="font-semibold text-primary">{entry.maintenance_note || 'Yok'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Before/After ── */}
      <section className="py-20 bg-primary/5 dark:bg-primary/10 px-6" id="yenilikler">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">Değişim ve Yenilik</h2>
            <p className="text-slate-500 dark:text-slate-400">Yaşam kalitemizi artıran modern dokunuşlar</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', title: 'Bahçe Düzenlemesi', desc: 'Peyzaj çalışmaları ile daha yeşil, daha ferah bir yaşam alanı oluşturuldu.', badge: 'Tamamlandı', date: 'Eylül 2026', badgeColor: 'bg-green-500' },
              { img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80', title: 'Giriş Tadilatı', desc: 'Apartman girişi, modern aydınlatma ve şık kaplama ile yeniden tasarlandı.', badge: 'Devam Ediyor', date: 'Ekim 2026', badgeColor: 'bg-blue-500' },
              { img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', title: 'Ortak Alan Güncellemesi', desc: 'Koridorlar ve ortak alanlar için enerji tasarruflu aydınlatma ve yeni boya uygulaması.', badge: 'Planlandı', date: 'Ocak 2027', badgeColor: 'bg-slate-500' },
            ].map(card => (
              <div key={card.title} className="flex flex-col gap-4">
                <div className="relative h-64 overflow-hidden rounded-2xl group">
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={card.img} alt={card.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-5">
                    <div className="flex justify-between items-center text-white">
                      <span className={`text-xs font-bold uppercase tracking-widest ${card.badgeColor} px-3 py-1 rounded-full`}>{card.badge}</span>
                      <span className="text-sm font-light">{card.date}</span>
                    </div>
                  </div>
                </div>
                <div className="px-1">
                  <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                  <p className="text-slate-500 text-sm">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Meetings preview ── */}
      <section className="py-20 px-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Toplantı Kayıtları</h2>
            <p className="text-slate-500 mt-1">Resmi kararlar ve gündem notları</p>
          </div>
          <Link to="/toplanti-notlari" className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap">
            Tümünü Gör
          </Link>
        </div>
        <Link to="/toplanti-notlari" className="block bg-white dark:bg-white/5 border border-primary/10 rounded-2xl p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary">event_available</span>
            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Toplantı Notlarını Görüntüle</h3>
          </div>
          <p className="text-slate-500 text-sm">Yönetim ve kurul toplantılarının resmi kayıtlarına, alınan kararlara ve katılım detaylarına ulaşın.</p>
        </Link>
      </section>

      {/* ── Finance teaser ── */}
      <section className="py-16 px-6 bg-primary text-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Finansal Şeffaflık</h2>
            <p className="text-slate-300 max-w-xl">Apartmanımızın tüm gelir ve gider kayıtlarını gerçek zamanlı takip edebilirsiniz.</p>
          </div>
          <Link to="/finansal" className="bg-white text-primary px-7 py-3.5 rounded-full font-bold hover:bg-slate-100 transition-colors whitespace-nowrap">
            Kayıtları İncele
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-primary/10">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2 opacity-60">
            <span className="material-symbols-outlined text-sm">apartment</span>
            <span className="text-xs font-semibold uppercase tracking-widest">Cumhuriyet Apartmanı</span>
          </div>
          <div className="text-slate-400 dark:text-slate-600 text-sm font-medium hover:text-slate-900 dark:hover:text-slate-100 opacity-50 hover:opacity-100 duration-500 cursor-default fade-in">
            Kutluhan Gül tarafından hazırlanmıştır
          </div>
          <div className="flex gap-4 mt-2 text-slate-400">
            <Link to="/toplanti-notlari" className="text-xs hover:text-primary transition-colors">Toplantı Notları</Link>
            <span>·</span>
            <Link to="/finansal" className="text-xs hover:text-primary transition-colors">Finansal Şeffaflık</Link>
            <span>·</span>
            <Link to="/giris" className="text-xs hover:text-primary transition-colors">Yönetici Girişi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
