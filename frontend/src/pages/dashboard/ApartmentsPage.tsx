import { useState, useEffect } from "react";
import { apartmentsApi } from "../../api";
import toast from "react-hot-toast";

// ❌ FIX: Gereksiz import kaldırıldı
// import { MONTHS, formatCurrency } from '../../utils/format';

interface Apartment {
  id: number;
  number: number;
  owner_name: string;
  floor: number;
  profession?: string;
  owner_photo?: string;
  room_type: string;
  notes: string;
}

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Apartment | null>(null);

  useEffect(() => {
    apartmentsApi.getAll().then((r) => setApartments(r.data));
  }, []);

  const filtered = apartments.filter(
    (a) =>
      a.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      String(a.number).includes(search),
  );

  const handleSave = async () => {
    if (!editing) return;

    try {
      await apartmentsApi.update(editing.id, editing);
      setApartments((prev) =>
        prev.map((a) => (a.id === editing.id ? editing : a)),
      );
      toast.success("Güncellendi!");
      setEditing(null);
    } catch {
      toast.error("Güncelleme başarısız.");
    }
  };

  return (
    <div className="p-5 space-y-4">
      <input
        placeholder="Ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.map((a) => (
        <div key={a.id}>{a.owner_name}</div>
      ))}
    </div>
  );
}
