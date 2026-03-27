import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetchNoAuth } from '../lib/api';
import { setToken } from '../lib/token';
import logo from '../assets/logo.png';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await apiFetchNoAuth<{token: string} & {account?: {displayName: string; storeName: string}}>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({email, password}),
        },
      );
      setToken(data.token);
      navigate('/kasir');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal login');
    }
  };
                    
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f6f7f8] font-sans antialiased text-slate-900">
      {/* Header/Top Nav */}
      <header className="flex items-center justify-between border-b border-slate-200 px-6 md:px-10 py-4 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center text-[#137fec]">
          <div className="size-12 flex items-center justify-center relative">
            <img src={logo} alt="Anti Rugi Logo" className="absolute size-24 max-w-none object-contain -left-2" />
          </div>
          <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight ml-8">Anti Rugi</h2>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px] flex flex-col gap-8 bg-white p-8 md:p-10 rounded-xl shadow-sm border border-slate-200"
        >
          {/* Title Section */}
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-slate-900 text-3xl font-extrabold tracking-tight">Login</h1>
            <p className="text-slate-500 text-base">Masukkan kredensial Anda untuk mengakses dasbor admin</p>
          </div>

          {/* Form Section */}
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-semibold">Alamat Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-[#137fec] transition-colors">
                  <Mail className="size-5" />
                </div>
                <input 
                  className="flex w-full rounded-lg text-slate-900 bg-white border border-slate-200 focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 h-12 pl-10 pr-4 placeholder:text-slate-400 text-base transition-all outline-none" 
                  placeholder="admin@antirugi.com" 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 text-sm font-semibold">Kata Sandi</label>
                <a className="text-[#137fec] hover:text-[#137fec]/80 text-xs font-semibold transition-colors" href="#">Lupa Kata Sandi?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-[#137fec] transition-colors">
                  <Lock className="size-5" />
                </div>
                <input 
                  className="flex w-full rounded-lg text-slate-900 bg-white border border-slate-200 focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 h-12 pl-10 pr-12 placeholder:text-slate-400 text-base transition-all outline-none" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center gap-2 py-1">
              <input 
                className="w-4 h-4 rounded border-slate-300 text-[#137fec] focus:ring-[#137fec] bg-white" 
                id="remember" 
                type="checkbox" 
              />
              <label className="text-sm text-slate-600 cursor-pointer" htmlFor="remember">Ingat perangkat ini</label>
            </div>

            {/* Login Button */}
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold h-12 text-base transition-all shadow-lg shadow-[#137fec]/20 active:scale-[0.98]">
              <span>Masuk</span>
              <LogIn className="size-5" />
            </button>
          </form>

          {/* Bottom Footer */}
          <div className="flex flex-col items-center gap-4 border-t border-slate-100 pt-6">
            <p className="text-slate-500 text-sm">
              Butuh bantuan? <a className="text-[#137fec] hover:underline font-medium" href="#"></a>
            </p>
            <p className="text-slate-500 text-sm">
              Belum punya akun? <Link to="/registration" className="text-[#137fec] hover:underline font-medium">Daftar</Link>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer Section */}
      <footer className="p-6 text-center">
        <p className="text-slate-400 text-xs">
          © 2026 Anti Rugi. Seluruh hak cipta dilindungi. Portal Admin SaaS Profesional.
        </p>
      </footer>
    </div>
  );
}
