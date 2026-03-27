import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Ya',
  cancelText = 'Batal',
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  type === 'danger' ? 'bg-red-100 text-red-600' :
                  type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-[#137fec]/10 text-[#137fec]'
                }`}>
                  {type === 'danger' && <AlertTriangle className="size-6" />}
                  {type === 'success' && <CheckCircle2 className="size-6" />}
                  {type === 'info' && <Info className="size-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
                    {message}
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
                {onConfirm && (
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] ${
                      type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
                      type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' :
                      'bg-[#137fec] hover:bg-[#137fec]/90 shadow-[#137fec]/20'
                    }`}
                  >
                    {confirmText}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
