import {useMemo, useState} from 'react';
import {Pencil, Plus, Trash2} from 'lucide-react';
import {usePos} from '../../pos/PosContext';
import type {PosMenuItem} from '../../pos/types';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import {getMenuIcon} from '../../utils/menuIcons';

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('IDR', 'Rp');
}

type Draft = Omit<PosMenuItem, 'id'> & {id?: string};

const EMPTY_DRAFT: Draft = {
  name: '',
  price: 0,
  image: '',
  category: 'Lainnya',
  isActive: true,
};

export default function PosMenu() {
  const {menuItems, upsertMenuItem, deleteMenuItem} = usePos();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PosMenuItem | null>(null);
  const [saved, setSaved] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return menuItems;
    return menuItems.filter((m) => m.name.toLowerCase().includes(query) || m.category.toLowerCase().includes(query));
  }, [menuItems, q]);

  const save = async () => {
    if (busy) return;
    if (!draft.name.trim()) return;
    if (!Number.isFinite(draft.price) || draft.price <= 0) return;
    setBusy(true);
    try {
      await upsertMenuItem({
        id: draft.id,
        name: draft.name,
        price: draft.price,
        image: draft.image?.trim() || undefined,
        category: draft.category,
        isActive: draft.isActive,
      });
      setDraft(EMPTY_DRAFT);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item: PosMenuItem) => {
    setDraft({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image ?? '',
      category: item.category,
      isActive: item.isActive,
    });
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black">Tambah Menu</h1>
            <p className="text-sm text-slate-500">Kelola daftar menu yang muncul di Kasir.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <label className="text-xs font-bold text-slate-600">Nama menu</label>
              <input
                className="mt-1 h-11 w-full rounded-xl bg-slate-100 px-3 text-sm outline-none focus:ring-2 focus:ring-[#137fec]"
                placeholder="Contoh: Es Kopi Susu"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({...d, name: e.target.value}))}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Harga</label>
              <input
                inputMode="numeric"
                className="mt-1 h-11 w-full rounded-xl bg-slate-100 px-3 text-sm outline-none focus:ring-2 focus:ring-[#137fec]"
                placeholder="15000"
                value={draft.price ? String(draft.price) : ''}
                onChange={(e) => setDraft((d) => ({...d, price: Number(e.target.value || 0)}))}
              />
            </div>

            <div className="relative">
              <label className="text-xs font-bold text-slate-600">Kategori</label>
              <div className="relative">
                <select
                  className="mt-1 h-11 w-full rounded-xl bg-slate-100 px-3 text-sm outline-none focus:ring-2 focus:ring-[#137fec] appearance-none cursor-pointer pr-10"
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({...d, category: e.target.value}))}
                >
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Camilan">Camilan</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-slate-400">
                  <svg className="size-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft((d) => ({...d, isActive: e.target.checked}))}
              />
              Aktif (muncul di kasir)
            </label>

            <div className="flex gap-2">
              {draft.id && (
                <button
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  onClick={() => setDraft(EMPTY_DRAFT)}
                >
                  Batal edit
                </button>
              )}
              <button
                className="h-11 rounded-xl bg-[#137fec] px-4 text-sm font-bold text-white hover:bg-[#137fec]/90 active:scale-[0.98] inline-flex items-center gap-2 justify-center"
                onClick={save}
                disabled={busy}
                style={busy ? {opacity: 0.7, cursor: 'not-allowed'} : undefined}
              >
                <Plus className="size-4" />
                {draft.id ? 'Simpan perubahan' : 'Tambah menu'}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <h2 className="text-base font-black">Daftar Menu</h2>
            <input
              className="h-11 w-full sm:w-80 rounded-xl bg-slate-100 px-3 text-sm outline-none focus:ring-2 focus:ring-[#137fec]"
              placeholder="Cari menu / kategori..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map((m) => (
              <div key={m.id} className="p-4 sm:p-5 flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 grid place-items-center text-2xl">
                  {getMenuIcon(m.name, m.category)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="font-black truncate">{m.name}</div>
                    <span className="text-xs font-bold rounded-full bg-slate-100 px-2 py-1 text-slate-600">{m.category}</span>
                    {!m.isActive && (
                      <span className="text-xs font-bold rounded-full bg-amber-100 px-2 py-1 text-amber-700">Nonaktif</span>
                    )}
                  </div>
                  <div className="mt-1 text-sm font-bold text-[#137fec]">{formatRupiah(m.price)}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="h-10 w-10 rounded-xl border border-slate-200 bg-white grid place-items-center text-slate-700 hover:bg-slate-50"
                    onClick={() => startEdit(m)}
                    title="Edit"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    className="h-10 w-10 rounded-xl border border-slate-200 bg-white grid place-items-center text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    onClick={() => setItemToDelete(m)}
                    title="Hapus"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-10 text-center text-sm text-slate-500">Menu belum ada. Tambahkan di form atas.</div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (!itemToDelete || busy) return;
          setBusy(true);
          try {
            await deleteMenuItem(itemToDelete.id);
            setSaved(true);
          } finally {
            setBusy(false);
            setItemToDelete(null);
          }
        }}
        title="Hapus Menu"
        message={`Apakah Anda yakin ingin menghapus menu "${itemToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />

      <Toast 
        show={saved} 
        message={itemToDelete ? "Menu berhasil dihapus!" : "Menu berhasil disimpan!"} 
        onClose={() => setSaved(false)} 
      />
    </div>
  );
}

