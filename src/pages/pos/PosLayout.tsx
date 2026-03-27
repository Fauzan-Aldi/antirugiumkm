import {useEffect, useState} from 'react';
import type React from 'react';
import {NavLink, Outlet, useNavigate} from 'react-router-dom';
import {LayoutGrid, PlusCircle, ReceiptText, Settings, LogOut, Bolt, MessageSquare, Clock, ShieldCheck} from 'lucide-react';
import {usePos, PosProvider} from '../../pos/PosContext';
import {getToken, clearToken} from '../../lib/token';
import logo from '../../assets/logo.png';
import Modal from '../../components/Modal';

type NavItem = {
  to: string;
  label: string;
  Icon: React.ComponentType<{className?: string}>;
  end?: boolean;
};

const NAV: NavItem[] = [
  {to: '/kasir', label: 'Kasir', Icon: LayoutGrid, end: true},
  {to: '/kasir/menu', label: 'Tambah Menu', Icon: PlusCircle},
  {to: '/kasir/penjualan', label: 'Riwayat Penjualan', Icon: ReceiptText},
  {to: '/kasir/settings', label: 'Pengaturan Akun', Icon: Settings},
];

const NavItemLink: React.FC<{item: NavItem}> = ({item}) => {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({isActive}) =>
        [
          'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
          isActive ? 'bg-[#137fec] text-white shadow-lg shadow-[#137fec]/20' : 'text-slate-700 hover:bg-slate-100',
        ].join(' ')
      }
    >
      <item.Icon className="size-5" />
      <span className="hidden lg:inline">{item.label}</span>
    </NavLink>
  );
};

function DesktopSidebar({onLogout, isAdmin, daysLeft}: {onLogout: () => void; isAdmin?: boolean; daysLeft: number}) {
  const isTrial = daysLeft > 0 && daysLeft <= 7;

  return (
    <aside className="hidden md:flex md:w-20 lg:w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-3">
      {/* ... (logo and main nav) */}
      <div className="px-2 py-4 mb-2">
        <div className="flex items-center">
          <div className="size-12 flex items-center justify-center relative shrink-0">
            <img src={logo} alt="Anti Rugi Logo" className="absolute size-24 max-w-none object-contain -left-2" />
          </div>
          <div className="hidden lg:block ml-8">
            <div className="text-xs font-black tracking-wider text-[#137fec] uppercase leading-none mb-1">ANTI RUGI</div>
            <div className="text-sm font-bold text-slate-900 leading-none">Sistem Kasir</div>
          </div>
        </div>
      </div>
      <nav className="flex flex-col gap-2 flex-1">
        {NAV.map((item) => <NavItemLink key={item.to} item={item} />)}
      </nav>
      
      <div className="mt-auto border-t border-slate-100 pt-3 flex flex-col gap-2">
        {isTrial && !isAdmin && (
          <div className="mb-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <div className="flex items-center gap-2 text-amber-800 mb-1">
              <Clock className="size-4" />
              <span className="text-[11px] font-black uppercase tracking-wider">Status Uji Coba</span>
            </div>
            <p className="text-[10px] font-bold text-amber-700 leading-tight">
              Sisa {daysLeft} hari lagi sebelum akun terkunci.
            </p>
          </div>
        )}
        <a 
          href="https://wa.me/6285363407399" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[#25D366] hover:bg-emerald-50 transition-colors"
        >
          <MessageSquare className="size-5" />
          <span className="hidden lg:inline">Hubungi CS</span>
        </a>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="size-5" />
          <span className="hidden lg:inline">Keluar</span>
        </button>
      </div>
    </aside>
  );
}

function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-screen-sm grid grid-cols-4">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({isActive}) =>
              [
                'flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold',
                isActive ? 'text-[#137fec]' : 'text-slate-600',
              ].join(' ')
            }
          >
            <item.Icon className="size-5" />
            <span className="leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function PosDataGuard({children}: {children: React.ReactNode}) {
  const {loading, error, reload, account} = usePos();
  const navigate = useNavigate();

  const isExpired = account?.subscriptionExpiresAt 
    ? new Date(account.subscriptionExpiresAt).getTime() <= Date.now() 
    : false;

  useEffect(() => {
    if (error && (error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('expired') || error.toLowerCase().includes('not found'))) {
      clearToken();
      navigate('/login');
    }
  }, [error, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f7f8]">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#137fec] text-white animate-spin">
          <Bolt className="size-8" />
        </div>
        <p className="mt-4 text-sm font-bold text-slate-600 animate-pulse">Memuat sistem Anti Rugi...</p>
      </div>
    );
  }

  if (isExpired && !account?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="size-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8">
          <Clock className="size-12" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-4">Masa Aktif Habis</h1>
        <p className="text-slate-500 max-w-md mb-8 font-medium leading-relaxed">
          Masa uji coba atau berlangganan akun Anda telah berakhir. 
          Silakan hubungi Customer Service untuk memperpanjang akses Anda.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <a 
            href={`https://wa.me/6285363407399?text=Halo%20Admin%20Anti%20Rugi,%20saya%20ingin%20memperpanjang%20masa%20aktif%20akun%20saya.%0A%0ANama%20Toko:%20*${encodeURIComponent(account?.storeName || '')}*%0AStatus:%20Masa%20Aktif%20Habis%0A%0AMohon%20informasi%20paket%20perpanjangan.%20Terima%20kasih!`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-[#25D366] text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:scale-[1.02] transition-all active:scale-95"
          >
            <MessageSquare className="size-5" />
            Hubungi WhatsApp CS
          </a>
          <button 
            onClick={() => {
              clearToken();
              navigate('/login');
            }}
            className="px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f7f8] p-6 text-center">
        <div className="size-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
          <Settings className="size-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-black mb-2 text-slate-900">Terjadi Kesalahan</h2>
        <p className="text-slate-500 mb-6 max-w-md font-medium">{error}</p>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              clearToken();
              navigate('/login');
            }}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
          >
            Login Ulang
          </button>
          <button 
            onClick={() => reload()}
            className="px-6 py-3 bg-[#137fec] text-white font-bold rounded-xl shadow-lg shadow-[#137fec]/20 hover:bg-[#137fec]/90 transition-all active:scale-95"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function PosInnerLayout({onLogout}: {onLogout: () => void}) {
  const {account} = usePos();
  
  const expiryDate = account?.subscriptionExpiresAt ? new Date(account.subscriptionExpiresAt) : null;
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const isTrial = daysLeft > 0 && daysLeft <= 7;

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-slate-900 flex flex-col">
      {isTrial && !account?.isAdmin && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-amber-800 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
          <Clock className="size-3" />
          <span>Sisa Waktu Uji Coba: {daysLeft} Hari</span>
        </div>
      )}
      <div className="flex flex-1 min-h-0">
        <DesktopSidebar onLogout={onLogout} isAdmin={account?.isAdmin} daysLeft={daysLeft} />
        <div className="flex-1 min-w-0 pb-16 md:pb-0 overflow-hidden flex flex-col">
          <Outlet />
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default function PosLayout() {
  const navigate = useNavigate();
  const token = getToken();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!token) navigate('/login');
  }, [navigate, token]);

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  if (!token) return null;

  return (
    <PosProvider>
      <PosDataGuard>
        <PosInnerLayout onLogout={() => setShowLogoutModal(true)} />

        <Modal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
          title="Keluar Aplikasi"
          message="Apakah Anda yakin ingin keluar dari sistem POS?"
          type="danger"
          confirmText="Ya, Keluar"
          cancelText="Batal"
        />
      </PosDataGuard>
    </PosProvider>
  );
}

