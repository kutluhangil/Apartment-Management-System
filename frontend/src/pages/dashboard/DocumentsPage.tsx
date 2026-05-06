import { useState, useEffect } from 'react';
import { documentsApi } from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const card = "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/[0.07]";
const inp = "w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400/30 transition-all";
const lbl = "block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-2";

const docIcon = (url: string) => {
  if (!url) return 'description';
  if (url.endsWith('.pdf')) return 'picture_as_pdf';
  if (url.match(/\.(jpg|jpeg|png|webp)$/i)) return 'image';
  return 'description';
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    try { const res = await documentsApi.getAll(); setDocuments(res.data); }
    catch { toast.error('Belgeler yüklenemedi.'); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error('Lütfen bir dosya seçin.');
    const fd = new FormData();
    fd.append('title', form.title);
    if (form.description) fd.append('description', form.description);
    fd.append('file', file);
    setUploading(true);
    try {
      await documentsApi.create(fd);
      toast.success('Belge yüklendi!');
      setAdding(false); setForm({ title: '', description: '' }); setFile(null);
      fetchDocuments();
    } catch { toast.error('Belge yüklenirken hata oluştu. Dosya çok büyük olabilir.'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu belgeyi silmek istediğinize emin misiniz?')) return;
    try { await documentsApi.delete(id); toast.success('Belge silindi!'); fetchDocuments(); }
    catch { toast.error('Silme başarısız.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Belgeler Arşivi</h1>
          <p className="text-gray-400 dark:text-white/40 text-sm mt-1">Yönetim planı, sözleşmeler ve tutanaklar</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => setAdding(!adding)}
            className="bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
            <span className="material-symbols-outlined text-[18px]">{adding ? 'close' : 'upload_file'}</span>
            {adding ? 'İptal' : 'Belge Yükle'}
          </button>
        )}
      </div>

      {adding && (
        <div className={`${card} rounded-2xl p-6`}>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500 dark:text-indigo-400 text-[18px]">upload_file</span>
            Yeni Belge Yükle
          </h3>
          <form onSubmit={handleUpload} className="space-y-4 max-w-xl">
            <div>
              <label className={lbl}>Dosya (PDF, DOCX, JPG, PNG)</label>
              <input required type="file" accept=".pdf,.doc,.docx,.jpg,.png"
                className="w-full text-sm text-gray-500 dark:text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 dark:file:bg-indigo-500/20 file:text-indigo-600 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-500/30 cursor-pointer"
                onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className={lbl}>Başlık</label>
              <input required className={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Açıklama (İsteğe bağlı)</label>
              <input className={inp} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <button type="submit" disabled={uploading}
              className="bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/20">
              {uploading && <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>}
              {uploading ? 'Yükleniyor...' : 'Yükle'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => (
          <div key={doc.id} className={`${card} p-5 rounded-2xl flex flex-col group hover:border-indigo-300 dark:hover:border-indigo-500/20 transition-all`}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">{docIcon(doc.file_url || '')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate" title={doc.title}>{doc.title}</h3>
                <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">{new Date(doc.upload_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            {doc.description && <p className="text-xs text-gray-400 dark:text-white/40 mb-4 line-clamp-2 flex-1">{doc.description}</p>}
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/[0.06]">
              <a href={doc.file_url} target="_blank" rel="noreferrer"
                className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-[18px]">download</span> İndir
              </a>
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button onClick={() => handleDelete(doc.id)}
                  className="text-gray-300 dark:text-white/20 hover:text-rose-500 dark:hover:text-rose-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              )}
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <div className={`col-span-full ${card} rounded-2xl p-12 text-center text-gray-300 dark:text-white/30`}>
            <span className="material-symbols-outlined text-4xl mb-3 block">folder_open</span>
            Henüz arşivde belge yok.
          </div>
        )}
      </div>
    </div>
  );
}
