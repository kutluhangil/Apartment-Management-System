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
    // Clean up legacy plaintext password storage from old version
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
    if (!form.email || !form.password) {
      toast.error('E-posta ve şifre gereklidir.');
      return;
    }
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
    <div className="min-h-screen flex flex-col bg-[#fafaf9] antialiased">
      {/* Top bar */}
      <div className="px-5 sm:px-8 h-14 flex items-center">
        <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#111] transition-colors">
          <span className="material-symbols-outlined text-lg">chevron_left</span>
          Ana Sayfa
        </Link>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-5 pb-20">
        <div className="w-full max-w-[380px]">
          {/* Logo + title */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-[#111] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-white text-2xl">apartment</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#111]">Yönetici Girişi</h1>
            <p className="text-sm text-slate-400 mt-1.5">Cumhuriyet Apartmanı yönetim paneli</p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 space-y-5"
          >
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                E-posta
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="ornek@cumhuriyet.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/15 focus:border-[#111]/40 transition-all"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="relative">
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                Şifre
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/15 focus:border-[#111]/40 transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-[37px] text-slate-400 hover:text-[#111] transition-colors p-1"
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
                className="h-4 w-4 rounded border-slate-300 text-[#111] focus:ring-[#111]/20"
              />
              <span className="text-[13px] text-slate-600">E-postamı hatırla</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">refresh</span>
                  Giriş yapılıyor…
                </>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-300 mt-6">
            Yalnızca yetkili yöneticiler giriş yapabilir.
          </p>
        </div>
      </div>
    </div>
  );
}
