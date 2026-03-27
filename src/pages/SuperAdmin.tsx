import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Search, 
  ShieldCheck, 
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/api';
import { getToken, clearToken } from '../lib/token';
import Toast from '../components/Toast';

type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  storeName: string;
  subscriptionExpiresAt: string;
  createdAt: string;
};

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [customDays, setCustomDays] = useState<{[key: string]: string}>({});
  const [toast, setToast] = useState<{show: boolean, message: string}>({show: false, message: ''});

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/owner-login');
      return;
    }
    loadUsers();
  }, [navigate]);

  const loadUsers = async () => {
    try {
      const data = await apiFetch<{users: AdminUser[]}>('/api/admin/users');
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    navigate('/owner-login');
  };

  const extendSubscription = async (userId: string, days: number) => {
    if (!days || days <= 0) return;
    setBusyId(userId);
    try {
      await apiFetch('/api/admin/extend-subscription', {
        method: 'POST',
        body: JSON.stringify({ userId, days }),
      });
      setToast({ show: true, message: `Berhasil menambah ${days} hari!` });
      setCustomDays(prev => ({ ...prev, [userId]: '' }));
      await loadUsers();
    } catch (err) {
      setToast({ show: true, message: 'Gagal memperbarui masa aktif' });
    } finally {
      setBusyId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.storeName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f7f8]">
        <Loader2 className="size-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="size-7 text-indigo-600" />
                Panel Owner Anti Rugi
              </h1>
              <p className="text-sm text-slate-500 font-medium">Pusat Aktivasi Paket Akun Pengguna</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari email atau toko..."
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 transition-all shadow-sm"
            >
              <LogOut className="size-4" />
              Keluar
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="size-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengguna</p>
              <p className="text-2xl font-black text-slate-900">{users.length}</p>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pengguna & Toko</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Masa Aktif</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Perpanjang Akses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const expiry = new Date(user.subscriptionExpiresAt);
                  const isExpired = expiry.getTime() <= Date.now();
                  const isBusy = busyId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{user.displayName}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                        <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-black text-slate-600 uppercase">
                          {user.storeName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 text-sm font-bold ${isExpired ? 'text-red-600' : 'text-emerald-600'}`}>
                          {isExpired ? <AlertCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
                          {expiry.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {isExpired ? 'Sudah Kedaluwarsa' : 'Masih Aktif'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {[
                            { label: '1 Minggu', days: 7, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-500' },
                            { label: '1 Bulan', days: 30, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-500' },
                            { label: '1 Tahun', days: 365, color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-500' },
                          ].map((opt) => (
                            <button
                              key={opt.label}
                              disabled={isBusy}
                              onClick={() => extendSubscription(user.id, opt.days)}
                              className={`px-4 py-2 border ${opt.color} hover:text-white text-xs font-black rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-sm uppercase tracking-wider`}
                            >
                              {opt.label}
                            </button>
                          ))}
                          {isBusy && <Loader2 className="size-4 text-indigo-600 animate-spin ml-2" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-slate-500 font-medium">
              Tidak ada pengguna ditemukan.
            </div>
          )}
        </div>
      </div>

      <Toast 
        show={toast.show} 
        message={toast.message} 
        onClose={() => setToast({show: false, message: ''})} 
      />
    </div>
  );
}
