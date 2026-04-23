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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setForm(f => ({ ...f, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading || isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('E-posta ve şifre gereklidir.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(form.email, form.password);
      // Cookie is set automatically by the server — we only receive user info
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', form.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      localStorage.removeItem('rememberedPassword'); // Eski güvensiz kaydı temizle
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark px-5">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Ana Sayfa
      </Link>

      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-white text-3xl">apartment</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Cumhuriyet Apartmanı</h1>
          <p className="text-slate-500 text-sm mt-1">Yönetici Paneli</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">E-posta</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="ornek@cumhuriyet.com"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Şifre</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoComplete="current-password"
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded text-primary focus:ring-primary/30"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              Şifreyi hatırla
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="material-symbols-outlined animate-spin text-lg">refresh</span> Giriş yapılıyor...</>
            ) : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
          <p>Yönetici: murat@cumhuriyet.com (3434murat)</p>
          <p>Admin: admin@cumhuriyet.com (095321Admin.)</p>
        </div>
      </div>
    </div>
  );
}
