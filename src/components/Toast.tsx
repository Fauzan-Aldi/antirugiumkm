import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, X, AlertCircle } from 'lucide-react';

interface ToastProps {
  show: boolean;
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ show, message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.95 }}
          className="fixed bottom-8 left-1/2 z-[10000] flex min-w-[320px] items-center gap-3 rounded-2xl bg-slate-900 px-4 py-4 shadow-2xl"
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {type === 'success' ? <CheckCircle2 className="size-6" /> : <AlertCircle className="size-6" />}
          </div>
          <div className="flex-1 text-sm font-bold text-white">
            {message}
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
