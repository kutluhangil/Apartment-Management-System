import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem('rememberedPassword');
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setForm(f => ({ ...f, email: savedEmail }));
      setRememberEmail(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading || isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('E-posta ve şifre gereklidir.');
    setLoading(true);
    try {
      const res = await authApi.login(form.email, form.password);
      if (rememberEmail) localStorage.setItem('rememberedEmail', form.email);
      else localStorage.removeItem('rememberedEmail');
      login(res.data.user);
      toast.success(`Hoş geldiniz, ${res.data.user.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white antialiased relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 opacity-30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-gradient-to-tl from-pink-500 to-rose-600 opacity-25 blur-3xl pointer-events-none" />

      {/* Top bar */}
      <div className="px-5 sm:px-8 h-14 flex items-center relative z-10">
        <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-lg">chevron_left</span>
          Ana Sayfa
        </Link>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-5 pb-20 relative z-10">
        <div className="w-full max-w-[400px]">
          {/* Logo + title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-purple-500/30">
              <span className="material-symbols-outlined text-white text-3xl">apartment</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Yönetici Girişi
            </h1>
            <p className="text-sm text-white/50 mt-2">Cumhuriyet Apartmanı yönetim paneli</p>
          </div>

          {/* Form — glassmorphic card */}
          <form
            onSubmit={handleSubmit}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-7 space-y-5 shadow-2xl"
          >
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-white/50 mb-2">
                E-posta
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="ornek@cumhuriyet.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/40 transition-all"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="relative">
              <label className="block text-[12px] font-bold uppercase tracking-wider text-white/50 mb-2">
                Şifre
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/40 transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-[42px] text-white/40 hover:text-white transition-colors p-1"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={e => setRememberEmail(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5"
              />
              <span className="text-[13px] text-white/70">E-postamı hatırla</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">refresh</span>
                  Giriş yapılıyor…
                </>
              ) : (
                <>
                  Giriş Yap
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-white/30 mt-6">
            Yalnızca yetkili yöneticiler giriş yapabilir.
          </p>
        </div>
      </div>
    </div>
  );
}
