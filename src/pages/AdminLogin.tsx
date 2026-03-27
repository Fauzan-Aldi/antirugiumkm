import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetchNoAuth } from '../lib/api';
import { setToken } from '../lib/token';
import logo from '../assets/logo.png';

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await apiFetchNoAuth<{token: string; account: {isAdmin: boolean}}>(
        '/api/admin/login',
        {
          method: 'POST',
          body: JSON.stringify({username, password}),
        },
      );
      
      setToken(data.token);
      navigate('/owner-panel');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal login admin');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-indigo-950 font-sans antialiased text-white">
      {/* Header/Top Nav */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 md:px-10 py-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center">
          <div className="size-12 flex items-center justify-center relative">
            <img src={logo} alt="Anti Rugi Logo" className="absolute size-24 max-w-none object-contain -left-2 brightness-0 invert" />
          </div>
          <h2 className="text-white text-lg font-bold leading-tight tracking-tight ml-8 uppercase tracking-widest">Anti Rugi <span className="text-indigo-400">Owner</span></h2>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[440px] flex flex-col gap-8 bg-white/10 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-2xl border border-white/10"
        >
          {/* Title Section */}
          <div className="flex flex-col gap-3 text-center">
            <div className="size-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="size-10 text-white" />
            </div>
            <h1 className="text-white text-3xl font-black tracking-tight">Owner Control</h1>
            <p className="text-indigo-200/60 text-sm font-medium">Panel khusus Owner untuk aktivasi paket akun</p>
          </div>

          {/* Form Section */}
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <div className="flex flex-col gap-2">
              <label className="text-indigo-100 text-xs font-bold uppercase tracking-wider">Username Owner</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-300 group-focus-within:text-white transition-colors">
                  <Mail className="size-5" />
                </div>
                <input 
                  className="flex w-full rounded-2xl text-white bg-white/5 border border-white/10 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 h-14 pl-12 pr-4 placeholder:text-white/20 text-base transition-all outline-none" 
                  placeholder="Masukkan Username" 
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-indigo-100 text-xs font-bold uppercase tracking-wider">Password Rahasia</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-300 group-focus-within:text-white transition-colors">
                  <Lock className="size-5" />
                </div>
                <input 
                  className="flex w-full rounded-2xl text-white bg-white/5 border border-white/10 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 h-14 pl-12 pr-14 placeholder:text-white/20 text-base transition-all outline-none" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 text-center animate-shake">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button type="submit" className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black h-14 text-base transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] mt-2">
              <span>Masuk Panel</span>
              <LogIn className="size-5" />
            </button>
          </form>

          {/* Bottom Footer */}
          <div className="text-center border-t border-white/5 pt-6">
            <button 
              onClick={() => navigate('/login')}
              className="text-indigo-300 hover:text-white text-sm font-bold transition-colors"
            >
              ← Kembali ke Login Kasir
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer Section */}
      <footer className="p-8 text-center">
        <p className="text-indigo-300/30 text-xs font-medium">
          Keamanan Tingkat Tinggi Terenkripsi. Akses Terbatas untuk Owner Anti Rugi.
        </p>
      </footer>
    </div>
  );
}
