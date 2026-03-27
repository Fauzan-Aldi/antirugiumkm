import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetchNoAuth } from '../lib/api';
import logo from '../assets/logo.png';

export default function Registration() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetchNoAuth('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({email, password, fullName}),
      });
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal registrasi');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f7f8] font-sans antialiased text-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 md:px-10 py-3 sticky top-0 z-50">
        <div className="flex items-center text-[#137fec]">
          <div className="size-12 flex items-center justify-center relative">
            <img src={logo} alt="Anti Rugi Logo" className="absolute size-24 max-w-none object-contain -left-2" />
          </div>
          <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight ml-8">Anti Rugi</h2>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden md:block text-slate-500 text-sm">Sudah punya akun?</p>
          <Link to="/login" className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] text-white text-sm font-bold hover:bg-[#137fec]/90 transition-colors">
            Masuk
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[560px] bg-white rounded-xl overflow-hidden shadow-xl shadow-[#137fec]/5 border border-slate-200"
        >
          {/* Form Section */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-8 text-center">
              <h1 className="text-slate-900 text-3xl font-black leading-tight tracking-tight">Pendaftaran</h1>
              <p className="text-slate-500 mt-2 text-base">Buat akun untuk mengelola dasbor toko digital Anda.</p>
            </div>
            <form className="space-y-5" onSubmit={handleCompleteRegistration}>
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="text-slate-400 size-5" />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#137fec] focus:border-transparent transition-all outline-none" 
                    placeholder="Masukkan nama lengkap Anda" 
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Alamat Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="text-slate-400 size-5" />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#137fec] focus:border-transparent transition-all outline-none" 
                    placeholder="admin@antirugi.com" 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">Kata Sandi</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-slate-400 size-5" />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#137fec] focus:border-transparent transition-all outline-none" 
                    placeholder="Buat kata sandi yang aman" 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#137fec] transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 py-2">
                <input 
                  className="rounded border-slate-300 text-[#137fec] focus:ring-[#137fec] bg-slate-50" 
                  id="terms" 
                  type="checkbox"
                  required
                />
                <label className="text-xs text-slate-500" htmlFor="terms">
                  Saya setuju dengan <a className="text-[#137fec] hover:underline" href="#">Ketentuan Layanan</a> dan <a className="text-[#137fec] hover:underline" href="#">Kebijakan Privasi</a>.
                </label>
              </div>
              <button type="submit" className="w-full bg-[#137fec] text-white font-bold py-4 rounded-lg shadow-lg shadow-[#137fec]/20 hover:bg-[#137fec]/90 transition-all flex items-center justify-center gap-2">
                <span>Selesaikan Pendaftaran</span>
                <ArrowRight className="size-4" />
              </button>
            </form>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 mt-4">
                {error}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-10 py-8 bg-white border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
          <p>© 2026 Anti Rugi. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-6">
            <a className="hover:text-[#137fec] transition-colors" href="#"></a>
            <a className="hover:text-[#137fec] transition-colors" href="#"> </a>
            <a className="hover:text-[#137fec] transition-colors" href="#"></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
