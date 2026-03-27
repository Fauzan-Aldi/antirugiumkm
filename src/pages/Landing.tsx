import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Zap,
  Loader2
} from 'lucide-react';
import { getToken } from '../lib/token';
import logo from '../assets/logo.png';

export default function Landing() {
  const navigate = useNavigate();
  const isLoggedIn = !!getToken();

  useEffect(() => {
    if (isLoggedIn) {
      const timer = setTimeout(() => {
        navigate('/kasir');
      }, 3000);
      return () => clearTimeout(timer);
    }

    const registrationTimer = setTimeout(() => {
      navigate('/registration');
    }, 10000);
    return () => clearTimeout(registrationTimer);
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-900 selection:bg-[#137fec]/20 selection:text-[#137fec] flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="size-10 flex items-center justify-center relative">
                <img src={logo} alt="Anti Rugi Logo" className="absolute size-20 max-w-none object-contain -left-1" />
              </div>
              <span className="text-xl font-black tracking-tight ml-6">Anti Rugi</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              {isLoggedIn ? (
                <Link 
                  to="/kasir" 
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#137fec] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#137fec]/20 hover:bg-[#137fec]/90 transition-all active:scale-95"
                >
                  Dashboard <ArrowRight className="size-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Height */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden pt-20">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#137fec]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#137fec]/10 text-[#137fec] text-xs font-bold uppercase tracking-wider mb-6">
                <Zap className="size-3 fill-current" /> AI Powered POS System
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
                Cuma Butuh <span className="text-[#137fec]">2 Kali Klik</span>, AI 'Anti Rugi' Siap Selamatkan Finansial UMKM! 🚀
              </h1>
              <p className="mt-8 text-lg md:text-xl text-slate-500 leading-relaxed max-w-3xl mx-auto font-medium">
                Inovasi buatan Pemuda Tanjung Pinang yang dirancang khusus untuk menghentikan kebocoran uang di toko Anda. Simpel, cerdas, dan bener-bener Anti Rugi.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                {isLoggedIn ? (
                  <Link 
                    to="/kasir" 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#137fec] text-white font-bold rounded-2xl shadow-2xl shadow-[#137fec]/30 hover:bg-[#137fec]/90 transition-all active:scale-95 text-lg"
                  >
                    Buka Dashboard <ArrowRight className="size-5" />
                  </Link>
                ) : (
                  <div className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-white text-[#137fec] font-bold rounded-2xl border border-slate-200 text-lg">
                    <Loader2 className="size-5 animate-spin" />
                  </div>
                )}
              </div>

              {/* Status Info for Logged In Users */}
              {isLoggedIn && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 text-sm font-bold text-[#137fec] flex items-center justify-center gap-2"
                >
                  <Loader2 className="size-4 animate-spin" /> Mengarahkan Anda ke dashboard dalam 3 detik...
                </motion.p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-10 border-t border-slate-50 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">
            © 2026 Anti Rugi • Solusi Digital UMKM Tanjung Pinang
          </p>
        </div>
      </footer>
    </div>
  );
}
