import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {LogOut, MessageSquare, Clock, ShieldCheck, Store, Download, Cloud, ChevronRight, Crown, Users, Sparkles, Edit3} from 'lucide-react';
import {usePos} from '../../pos/PosContext';
import {clearToken} from '../../lib/token';
import Modal from '../../components/Modal'; 
import Toast from '../../components/Toast';

export default function PosAccountSettings() {
  const navigate = useNavigate();
  const {account, setAccount} = usePos();
  const [draft, setDraft] = useState({
    displayName: account?.displayName ?? '',
    storeName: account?.storeName ?? '',
  });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditProfileForm, setShowEditProfileForm] = useState(false);
  const [infoToast, setInfoToast] = useState('');

  const expiryDate = account?.subscriptionExpiresAt ? new Date(account.subscriptionExpiresAt) : null;
  const isExpired = expiryDate ? expiryDate.getTime() <= Date.now() : false;
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await setAccount({
        displayName: draft.displayName.trim() || 'Kasir',
        storeName: draft.storeName.trim() || 'Anti Rugi',
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    } finally {
      setBusy(false);
    }
  };

  const askInstallApp = () => {
    setInfoToast('Untuk install aplikasi: buka browser menu > "Install app"/"Tambahkan ke layar utama".');
    window.setTimeout(() => setInfoToast(''), 2400);
  };

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">Pengaturan</h1>
          <p className="text-sm text-slate-500">Kelola akun, toko, aplikasi, dan fitur lanjutan.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="size-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Store className="size-6" />
              </div>
              <div>
                <div className="text-base font-black text-slate-900">{account?.storeName || 'Anti Rugi'}</div>
                <div className="text-sm font-semibold text-slate-600">{account?.displayName || 'Kasir'}</div>
                <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                  <Clock className="size-3.5" />
                  {isExpired
                    ? 'Masa aktif berakhir'
                    : `Aktif s/d ${expiryDate?.toLocaleDateString('id-ID', {year: 'numeric', month: '2-digit', day: '2-digit'})} (${daysLeft} hari)`}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowEditProfileForm((v) => !v)}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 inline-flex items-center justify-center gap-2"
            >
              <Edit3 className="size-4" />
              Edit Profil Toko
            </button>
          </div>
        </div>

        {showEditProfileForm && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4 shadow-sm">
            <div className="text-sm font-black text-slate-900">Edit Profil Toko</div>
            <div>
              <label className="text-xs font-bold text-slate-600">Nama kasir</label>
              <input
                className="mt-1 h-11 w-full rounded-xl bg-slate-100 px-3 text-sm outline-none focus:ring-2 focus:ring-[#137fec]"
                value={draft.displayName}
                onChange={(e) => setDraft((d) => ({...d, displayName: e.target.value}))}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Nama toko</label>
              <input
                className="mt-1 h-11 w-full rounded-xl bg-slate-100 px-3 text-sm outline-none focus:ring-2 focus:ring-[#137fec]"
                value={draft.storeName}
                onChange={(e) => setDraft((d) => ({...d, storeName: e.target.value}))}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => setShowEditProfileForm(false)}
                className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={busy}
                className="h-11 px-4 rounded-xl bg-[#137fec] text-white text-sm font-bold hover:bg-[#0f6bcc] disabled:opacity-60"
              >
                {busy ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-600">Aplikasi & Akun</h2>
          </div>
          <button
            onClick={() => setShowEditProfileForm(true)}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 border-b border-slate-100"
          >
            <div className="flex items-start gap-3 text-left">
              <div className="mt-0.5 size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Store className="size-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Edit Profil Warung / Toko</div>
                <div className="text-xs text-slate-500">Ubah nama toko dan nama kasir yang terlihat.</div>
              </div>
            </div>
            <ChevronRight className="size-4 text-slate-400" />
          </button>

          <div className="w-full px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-100">
            <div className="flex items-start gap-3 text-left">
              <div className="mt-0.5 size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Download className="size-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Install Aplikasi</div>
                <div className="text-xs text-slate-500">Tambahkan ke layar utama browser untuk akses cepat.</div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Cloud className="size-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Data Cloud Aman</div>
                <div className="text-xs text-slate-500">Semua data tersimpan aman di cloud.</div>
              </div>
            </div>
          </div>

          <a
            href={`https://wa.me/6285363407399?text=Halo%20Admin%20Anti%20Rugi,%20saya%20butuh%20bantuan.%0A%0ANama%20Toko:%20*${encodeURIComponent(account?.storeName || '')}*`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <MessageSquare className="size-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Hubungi Dukungan CS</div>
                <div className="text-xs text-slate-500">Ada kendala? Chat via WhatsApp.</div>
              </div>
            </div>
            <ChevronRight className="size-4 text-slate-400" />
          </a>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-600">Fitur Lanjutan</h2>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-slate-200 text-slate-700">Pro</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Users className="size-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Manajemen Kasir / Staf</div>
                <div className="text-xs text-slate-500">Tambah akun khusus karyawan.</div>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Crown className="size-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Masa Aktif Langganan (SaaS Premium)</div>
                <div className="text-xs text-slate-500">
                  {isExpired
                    ? 'Status: Tidak aktif'
                    : `Aktif sampai ${expiryDate?.toLocaleDateString('id-ID', {year: 'numeric', month: '2-digit', day: '2-digit'})}`}
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Sparkles className="size-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Anti Rugi v1.0</div>
                <div className="text-xs text-slate-500">Build stabil dengan sistem cloud.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-red-900">Keluar Akun (Logout)</div>
              <p className="text-xs text-red-700/80 mt-1">Sesi berakhir dan perlu login ulang untuk akses data.</p>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:scale-[0.98] transition-all"
            >
              <LogOut className="size-4" />
              Keluar
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Keluar Aplikasi"
        message="Apakah Anda yakin ingin keluar? Sesi Anda akan berakhir dan Anda harus login kembali untuk mengakses data."
        type="danger"
        confirmText="Ya, Keluar"
        cancelText="Batal"
      />

      <Toast 
        show={saved} 
        message="Pengaturan berhasil disimpan!" 
        onClose={() => setSaved(false)} 
      />
      <Toast
        show={Boolean(infoToast)}
        message={infoToast}
        onClose={() => setInfoToast('')}
      />
    </div>
  );
}

