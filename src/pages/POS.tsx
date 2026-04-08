import {useMemo, useState, useEffect} from 'react';
import {Bolt, Search, Bell, UserCircle, Clock, Trash2, Minus, Plus, Banknote, Wallet, CheckCircle2, X} from 'lucide-react';
import {motion, AnimatePresence} from 'motion/react';
import {usePos} from '../pos/PosContext';
import {useSubscriptionGuard} from '../pos/useSubscriptionGuard';
import type {PosCartItem, PosMenuItem, PosSalePaymentMethod} from '../pos/types';
import Toast from '../components/Toast';
import {getMenuIcon} from '../utils/menuIcons';

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning';
};

export default function POS() {
  const {account, menuItems, categories, addSale, loading} = usePos();
  const { isExpired } = useSubscriptionGuard();
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PosSalePaymentMethod>('tunai');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [saved, setSaved] = useState(false);
  const [trialToast, setTrialToast] = useState(false);
  
  // Redirect if expired (handled by useSubscriptionGuard)
  if (isExpired && !account?.isAdmin) {
    return null; // Will redirect
  }
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  const activeMenu = useMemo(() => menuItems.filter((m) => m.isActive), [menuItems]);

  const expiryDate = account?.subscriptionExpiresAt ? new Date(account.subscriptionExpiresAt) : null;
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const isTrial = daysLeft > 0 && daysLeft <= 7;

  // Initialize notifications
  useEffect(() => {
    if (!account) return;
    
    // Show trial toast once on mount
    if (isTrial && !account.isAdmin) {
      setTrialToast(true);
    }

    const initialNotifs: Notification[] = [
      {
        id: '1',
        title: 'Selamat Datang!',
        message: `Halo ${account.displayName}, sistem Anti Rugi siap membantu toko Anda hari ini.`,
        time: 'Baru saja',
        isRead: false,
        type: 'info'
      }
    ];

    if (isTrial && !account.isAdmin) {
      initialNotifs.push({
        id: 'trial-warning',
        title: 'Masa Uji Coba',
        message: `Akun Anda sedang dalam masa uji coba. Sisa waktu: ${daysLeft} hari lagi.`,
        time: '1 menit yang lalu',
        isRead: false,
        type: 'warning'
      });
    }

    setNotifications(initialNotifs);
  }, [account, daysLeft, isTrial]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const removeNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return activeMenu.filter((p) => {
      const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchesSearch = !query || p.name.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeMenu, searchQuery, selectedCategory]);

  const addToCart = (product: PosMenuItem) => {
    console.log('DEBUG - isExpired:', isExpired, 'isAdmin:', account?.isAdmin, 'expiryDate:', expiryDate);
    if (isExpired && !account?.isAdmin) {
      window.alert('Masa aktif akun telah berakhir. Silakan hubungi CS untuk perpanjang.');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  // Tidak pakai pajak 10% (PPN/VAT) agar total = subtotal
  const tax = 0;
  const total = subtotal;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price).replace('IDR', 'Rp');
  };

  const parseRupiahInput = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, '');
    if (!digits) return 0;
    const n = Number(digits);
    return Number.isFinite(n) ? n : 0;
  };

  const cashReceived = useMemo(() => parseRupiahInput(cashReceivedInput), [cashReceivedInput]);
  const change = useMemo(() => cashReceived - total, [cashReceived, total]);

  const cashQuickOptions = useMemo(() => {
    const base = [10000, 20000, 50000, 100000, 200000, 500000, 1000000];
    const opts = base.filter((v) => v >= Math.max(1000, total));
    // kalau total kecil, tetap tampilkan beberapa nominal kecil
    if (total < 10000) return [10000, 20000, 50000, 100000];
    return opts.length ? opts.slice(0, 4) : [100000, 200000, 500000, 1000000];
  }, [total]);

  // Reset input tunai saat keranjang kosong / metode berubah
  useEffect(() => {
    if (paymentMethod !== 'tunai') setCashReceivedInput('');
  }, [paymentMethod]);

  useEffect(() => {
    if (cart.length === 0) setCashReceivedInput('');
  }, [cart.length]);

  const saveSale = async () => {
    if (isExpired && !account?.isAdmin) {
      window.alert('Masa aktif akun telah berakhir. Silakan hubungi CS untuk perpanjang.');
      return;
    }
    if (cart.length === 0) return;
    if (paymentMethod === 'tunai' && total > 0 && cashReceived < total) {
      window.alert('Uang tunai kurang dari total belanja.');
      return;
    }
    try {
      await addSale({
        items: cart.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          category: it.category,
        })),
        subtotal,
        tax,
        total,
        paymentMethod,
      });
      clearCart();
      setSaved(true);
    } catch {
      // Biarkan user mencoba lagi; error sudah ditangani di apiFetch
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#f6f7f8] font-sans antialiased text-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-3 shrink-0 gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#137fec] text-white">
              <Bolt className="size-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Kasir Kilat</h1>
              <p className="text-xs text-slate-500 truncate max-w-[180px] sm:max-w-none">{account.storeName}</p>
            </div>
          </div>
          <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
          <div className="relative w-40 sm:w-64 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <input 
              className="h-10 w-full rounded-lg border-none bg-slate-100 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#137fec] outline-none" 
              placeholder="Cari menu..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {(isTrial || account?.isAdmin) && (
              <div className={`hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5 ${
                account?.isAdmin ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-700'
              }`}>
                <Clock className="size-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {account?.isAdmin ? 'Super Admin' : `Uji Coba: ${daysLeft} Hari Lagi`}
                </span>
              </div>
            )}
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifPopover(!showNotifPopover);
                  if (!showNotifPopover) markAllAsRead();
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors relative ${
                  showNotifPopover ? 'bg-slate-100 text-[#137fec]' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              <AnimatePresence>
                {showNotifPopover && (
                  <>
                    {/* Backdrop for closing */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifPopover(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-black text-slate-900">Notifikasi</h3>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-[#137fec]/10 text-[#137fec] px-2 py-0.5 rounded-full">
                          {notifications.length} Total
                        </span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-slate-50">
                            {notifications.map((notif) => (
                              <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors group relative">
                                <div className="flex gap-3">
                                  <div className={`mt-1 size-2 rounded-full shrink-0 ${
                                    notif.type === 'warning' ? 'bg-amber-500' :
                                    notif.type === 'success' ? 'bg-emerald-500' : 'bg-[#137fec]'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-2 font-medium">{notif.time}</p>
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeNotif(notif.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded-md transition-all text-slate-400"
                                  >
                                    <X className="size-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-10 text-center">
                            <div className="size-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                              <Bell className="size-6" />
                            </div>
                            <p className="text-sm font-medium text-slate-400">Tidak ada notifikasi</p>
                          </div>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                          <button 
                            onClick={() => setNotifications([])}
                            className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
                          >
                            Hapus Semua
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button className="flex h-10 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors px-2 gap-2">
              <UserCircle className="size-6 text-slate-600" />
              <span className="hidden md:inline text-sm font-bold text-slate-700">{account.displayName}</span>
            </button>
          </div>
      </header>

      <main className="flex flex-1 overflow-hidden flex-col lg:flex-row lg:overflow-hidden overflow-y-auto">
        {/* Left Side: Catalog */}
        <div className="flex flex-1 flex-col overflow-hidden lg:h-auto h-[40vh] shrink-0">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto bg-white px-4 sm:px-6 py-3 border-b border-slate-200 no-scrollbar">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  selectedCategory === cat 
                    ? "bg-[#137fec] text-white" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map(product => (
                  <motion.button 
                    key={product.id}
                    whileTap={isExpired && !account?.isAdmin ? {} : { scale: 0.98 }}
                    onClick={() => addToCart(product)}
                    disabled={isExpired && !account?.isAdmin}
                    className={`group flex flex-col items-start rounded-xl border border-slate-200 p-3 shadow-sm transition-all text-left ${
                      isExpired && !account?.isAdmin 
                        ? 'bg-slate-100 opacity-50 cursor-not-allowed' 
                        : 'bg-white hover:border-[#137fec]'
                    }`}
                  >
                    <div className="mb-3 aspect-square w-full overflow-hidden rounded-lg bg-slate-50 relative">
                      <div className="flex h-full w-full items-center justify-center text-4xl bg-slate-100 group-hover:scale-110 transition-transform duration-300">
                        {getMenuIcon(product.name, product.category)}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">{product.name}</p>
                    <p className="text-sm font-semibold text-[#137fec]">{formatPrice(product.price)}</p>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                  <Plus className="size-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Menu Belum Ada</h3>
                <p className="text-sm text-slate-500 max-w-xs mt-1">
                  {searchQuery || selectedCategory !== 'Semua' 
                    ? "Tidak ada menu yang sesuai dengan pencarian Anda." 
                    : "Klik 'Tambah Menu' di sidebar untuk mulai mengisi daftar jualan Anda."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Order Detail */}
        <aside className="flex w-full lg:w-96 flex-col border-t lg:border-t-0 lg:border-l border-slate-200 bg-white lg:h-auto shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold">Detail Pesanan</h2>
            <button 
              onClick={clearCart}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0">
            <div className="space-y-4">
              <AnimatePresence>
                {cart.map(item => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-bold leading-none">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg bg-slate-100 p-1">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Bolt className="size-10 opacity-20 mb-2" />
                  <p className="text-sm">Belum ada pesanan</p>
                </div>
              )}
            </div>
          </div>

          {/* Checkout Section */}
          <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-dashed border-slate-300 pt-2">
                <span>Total</span>
                <span className="text-[#137fec]">{formatPrice(total)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`flex items-center justify-center gap-2 rounded-xl border-2 bg-white py-3 font-bold transition-colors ${
                  paymentMethod === 'tunai'
                    ? 'border-[#137fec] text-[#137fec]'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => setPaymentMethod('tunai')}
              >
                <Banknote className="size-5" />
                Tunai
              </button>
              <button
                className={`flex items-center justify-center gap-2 rounded-xl border-2 bg-white py-3 font-bold transition-colors ${
                  paymentMethod === 'transfer'
                    ? 'border-[#137fec] text-[#137fec]'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => setPaymentMethod('transfer')}
              >
                <Wallet className="size-5" />
                Transfer
              </button>
            </div>

            {paymentMethod === 'tunai' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-slate-900">Pembayaran Tunai</div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-[#137fec] text-white text-xs font-bold hover:bg-[#137fec]/90 transition-colors disabled:opacity-50"
                    onClick={() => setCashReceivedInput(String(total))}
                    disabled={cart.length === 0}
                  >
                    Uang Pas
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600">Uang diterima</label>
                  <input
                    inputMode="numeric"
                    className="mt-1 h-11 w-full rounded-xl bg-slate-100 px-3 text-sm outline-none focus:ring-2 focus:ring-[#137fec]"
                    placeholder="Contoh: 100000"
                    value={cashReceivedInput}
                    onChange={(e) => setCashReceivedInput(e.target.value)}
                    disabled={cart.length === 0}
                  />
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {cashQuickOptions.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className="h-9 rounded-xl bg-slate-100 text-slate-700 text-xs font-black hover:bg-slate-200 disabled:opacity-60"
                        onClick={() => setCashReceivedInput(String(v))}
                        disabled={cart.length === 0}
                        title={formatPrice(v)}
                      >
                        {Math.round(v / 1000)}k
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total</span>
                    <span className="font-black">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500">Diterima</span>
                    <span className="font-black">{formatPrice(cashReceived)}</span>
                  </div>
                  <div className="flex justify-between mt-2 border-t border-dashed border-slate-300 pt-2">
                    <span className="text-slate-700 font-black">{change >= 0 ? 'Kembalian' : 'Kurang'}</span>
                    <span className={`font-black ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatPrice(Math.abs(change))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'transfer' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-slate-900">Pembayaran Transfer</div>
                  <div className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                    Langsung Lunas
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <div className="text-xs font-bold text-slate-500 mb-1">Total Transfer</div>
                  <div className="text-2xl font-black text-[#137fec]">{formatPrice(total)}</div>
                </div>

                <div className="text-xs text-slate-600 space-y-2">
                  <p className="font-bold text-slate-900">Instruksi Pembayaran:</p>
                  <p>1. Transfer sesuai total nominal di atas</p>
                  <p>2. Konfirmasi pembayaran ke pembeli</p>
                  <p>3. Klik "Simpan Penjualan" setelah transfer diterima</p>
                </div>

                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status</span>
                    <span className="font-black text-emerald-700">Menunggu Konfirmasi</span>
                  </div>
                  <div className="flex justify-between mt-1 border-t border-emerald-200 pt-2">
                    <span className="text-slate-700 font-black">Total Tagihan</span>
                    <span className="font-black text-[#137fec]">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            )}

            <button 
              disabled={cart.length === 0 || loading || (paymentMethod === 'tunai' && total > 0 && cashReceived < total) || (isExpired && !account?.isAdmin)}
              onClick={saveSale}
              className="w-full rounded-xl bg-[#137fec] py-4 text-center text-base font-bold text-white shadow-lg shadow-[#137fec]/30 hover:bg-[#137fec]/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {isExpired && !account?.isAdmin ? (
                'Masa Aktif Habis - Hubungi CS'
              ) : saved ? (
                <>
                  <CheckCircle2 className="size-5" />
                  Tersimpan
                </>
              ) : (
                'Simpan Penjualan'
              )}
            </button>
          </div>
        </aside>
      </main>

      <Toast 
        show={saved} 
        message="Transaksi berhasil disimpan!" 
        onClose={() => setSaved(false)} 
      />

      <Toast 
        show={trialToast} 
        message={`Pengingat: Masa uji coba akun Anda sisa ${daysLeft} hari lagi.`} 
        onClose={() => setTrialToast(false)} 
      />
    </div>
  );
}
