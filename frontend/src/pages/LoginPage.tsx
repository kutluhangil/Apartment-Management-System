import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail) {
      setForm(f => ({ ...f, email: savedEmail }));
      setRememberMe(true);
    }
    if (savedPassword) {
      setForm(f => ({ ...f, password: savedPassword }));
      setRememberPassword(true);
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
      
      if (rememberMe) localStorage.setItem('rememberedEmail', form.email);
      else localStorage.removeItem('rememberedEmail');

      if (rememberPassword) localStorage.setItem('rememberedPassword', form.password);
      else localStorage.removeItem('rememberedPassword');

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9] px-5">
      <Link to="/" className="absolute top-5 left-5 sm:top-6 sm:left-6 flex items-center gap-2 text-sm text-slate-400 hover:text-[#111] transition-colors">
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        <span className="hidden sm:inline">Ana Sayfa</span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#111] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-white text-2xl">apartment</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#111]">Cumhuriyet Apartmanı</h1>
          <p className="text-slate-400 text-sm mt-1">Yönetici Girişi</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7 sm:p-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">E-posta</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="ornek@cumhuriyet.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/20 focus:border-[#111]/30 transition-all"
              autoComplete="email"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Şifre</label>
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#111]/20 focus:border-[#111]/30 transition-all"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] text-slate-400 hover:text-[#111] transition-colors"
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#111] focus:ring-[#111]/20"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-slate-600 cursor-pointer select-none">
                E-postamı hatırla
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="remember-password"
                type="checkbox"
                checked={rememberPassword}
                onChange={e => setRememberPassword(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#111] focus:ring-[#111]/20"
              />
              <label htmlFor="remember-password" className="ml-2 text-sm text-slate-600 cursor-pointer select-none">
                Şifremi hatırla
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#111] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading
              ? <><span className="material-symbols-outlined animate-spin text-lg">refresh</span> Giriş yapılıyor...</>
              : 'Giriş Yap'
            }
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-300 space-y-1">
          <p>murat@cumhuriyet.com</p>
          <p>kutluhan@cumhuriyet.com</p>
        </div>
      </div>
    </div>
  );
}
