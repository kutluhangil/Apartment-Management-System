import { useState, useEffect } from "react";
import { apartmentsApi } from "../../api";
import toast from "react-hot-toast";

interface Apartment { id: number; number: number; owner_name: string; floor: number; profession?: string; owner_photo?: string; room_type: string; notes: string; }

const inp = "w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400/30 transition-all";
const sel = "w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all";
const lbl = "block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2";

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Apartment | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    apartmentsApi.getAll().then(r => setApartments(r.data)).catch(() => {});
  }, []);

  const filtered = apartments.filter(a =>
    a.owner_name.toLowerCase().includes(search.toLowerCase()) || String(a.number).includes(search)
  );

  const handleSave = async () => {
    if (!editing) return;
    try {
      await apartmentsApi.update(editing.id, editing);
      setApartments(prev => prev.map(a => a.id === editing.id ? editing : a));
      toast.success("Güncellendi!");
      setEditing(null);
    } catch { toast.error("Güncelleme başarısız."); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editing || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) return toast.error("Dosya çok büyük (Max 5MB)");
    setUploading(true);
    try {
      const res = await apartmentsApi.uploadPhoto(editing.id, file);
      const newPhotoUrl = res.data.url;
      setEditing({ ...editing, owner_photo: newPhotoUrl });
      setApartments(prev => prev.map(a => a.id === editing.id ? { ...a, owner_photo: newPhotoUrl } : a));
      toast.success("Fotoğraf yüklendi!");
    } catch { toast.error("Fotoğraf yüklenemedi."); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Daire Listesi</h1>
          <p className="text-white/40 text-sm mt-1">Cumhuriyet Apartmanı'nın 18 dairesi</p>
        </div>
        <div className="relative max-w-xs w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-[18px]">search</span>
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            placeholder="Daire no veya isim ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(apt => (
          <div key={apt.id} className="group relative bg-zinc-900 border border-white/[0.07] rounded-2xl p-5 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center font-black text-sm">
                  {String(apt.number).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{apt.owner_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-white/40">Kat {apt.floor} · Daire {apt.number}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${apt.room_type === "3+1" ? "bg-indigo-500/15 text-indigo-300" : "bg-amber-500/15 text-amber-300"}`}>
                      {apt.room_type}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setEditing({ ...apt })}
                className="p-1.5 text-white/20 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all">
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>

            {apt.profession && (
              <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">work</span>
                {apt.profession}
              </p>
            )}

            {/* Hover profile tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-56 opacity-0 pointer-events-none scale-95 origin-bottom group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50">
              <div className="bg-zinc-800 border border-white/10 rounded-2xl p-4 shadow-2xl text-center">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0 mx-auto mb-3 border border-white/10">
                  {apt.owner_photo ? (
                    <img src={`/api${apt.owner_photo}`} alt={apt.owner_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/20 text-2xl">person</span>
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white">{apt.owner_name}</h4>
                <p className="text-xs text-indigo-300 mt-0.5">{apt.profession || "Daire Sakini"}</p>
                {apt.notes && <p className="text-xs text-white/40 mt-2 bg-white/5 rounded-lg p-2">{apt.notes}</p>}
              </div>
              <div className="w-3 h-3 bg-zinc-800 border-r border-b border-white/10 rotate-45 mx-auto -mt-1.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-white text-lg">Daire {editing.number} Düzenle</h3>
              <button onClick={() => setEditing(null)} className="p-1 text-white/30 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div>
              <label className={lbl}>Daire Sahibi</label>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex-shrink-0 relative">
                  {editing.owner_photo ? (
                    <img src={`/api${editing.owner_photo}`} alt="Owner" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-white/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">person</span>
                  )}
                </div>
                <label className="text-xs font-bold text-indigo-400 cursor-pointer hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">upload</span>
                  Fotoğraf Yükle
                  {uploading && <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>}
                  <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
              </div>
              <input className={inp} value={editing.owner_name} onChange={e => setEditing({ ...editing, owner_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Kat</label>
                <input type="number" className={inp} value={editing.floor} onChange={e => setEditing({ ...editing, floor: +e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Daire Tipi</label>
                <select className={sel} value={editing.room_type} onChange={e => setEditing({ ...editing, room_type: e.target.value })}>
                  <option value="2+1">2+1</option>
                  <option value="3+1">3+1</option>
                </select>
              </div>
            </div>
            <div>
              <label className={lbl}>Meslek</label>
              <input type="text" className={inp} value={editing.profession || ""} onChange={e => setEditing({ ...editing, profession: e.target.value })} />
            </div>
            <button onClick={handleSave}
              className="w-full bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white py-3 rounded-xl font-black transition-all shadow-lg shadow-indigo-500/20">
              Kaydet
            </button>
          </div>
        </div>
      )}

      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-indigo-400">info</span>
        </div>
        <p className="text-sm text-white/50">
          Sakin bilgisi eksik daireleri güncellemek için <span className="text-indigo-300 font-bold">düzenleme</span> butonuna tıklayın.
        </p>
      </div>
    </div>
  );
}
