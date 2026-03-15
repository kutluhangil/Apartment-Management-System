import { useState, useEffect } from 'react';
import { documentsApi } from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await documentsApi.getAll();
      setDocuments(res.data);
    } catch {
      toast.error('Belgeler yüklenemedi.');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error('Lütfen bir dosya seçin.');
    
    const formData = new FormData();
    formData.append('title', form.title);
    if (form.description) formData.append('description', form.description);
    formData.append('file', file);

    setUploading(true);
    try {
      await documentsApi.create(formData);
      toast.success('Belge yüklendi!');
      setAdding(false);
      setForm({ title: '', description: '' });
      setFile(null);
      fetchDocuments();
    } catch {
      toast.error('Belge yüklenirken bir hata oluştu. Dosya çok büyük veya token hatalı olabilir.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu belgeyi silmek istediğinize emin misiniz?')) return;
    try {
      await documentsApi.delete(id);
      toast.success('Belge silindi!');
      fetchDocuments();
    } catch {
      toast.error('Silme başarısız.');
    }
  };

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Belgeler Arşivi</h1>
          <p className="text-slate-500 text-sm mt-1">Yönetim planı, sözleşmeler ve tutanaklar</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => setAdding(!adding)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">{adding ? 'close' : 'upload_file'}</span>
            {adding ? 'İptal' : 'Belge Yükle'}
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6">
          <form onSubmit={handleUpload} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1.5">Dosya (PDF, DOCX, JPG, PNG)</label>
              <input required type="file" className="w-full text-sm" accept=".pdf,.doc,.docx,.jpg,.png" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Başlık</label>
              <input required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Açıklama (İsteğe bağlı)</label>
              <input className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <button type="submit" disabled={uploading} className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
              {uploading && <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>}
              {uploading ? 'Yükleniyor...' : 'Yükle'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col group hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">description</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate" title={doc.title}>{doc.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{new Date(doc.upload_date).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            {doc.description && <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 flex-1">{doc.description}</p>}
            
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">download</span> İndir
              </a>
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button onClick={() => handleDelete(doc.id)} className="text-slate-400 hover:text-red-500 text-sm font-semibold">Sil</button>
              )}
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-500">Henüz arşivde belge yok.</div>
        )}
      </div>
    </div>
  );
}
