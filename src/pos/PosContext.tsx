import type {ReactNode} from 'react';
import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {apiFetch} from '../lib/api';
import type {PosAccount, PosMenuItem, PosSale, PosSalePaymentMethod} from './types';

type PosState = {
  loading: boolean;
  error: string | null;

  account: PosAccount;
  setAccount: (next: PosAccount) => Promise<void>;

  menuItems: PosMenuItem[];
  upsertMenuItem: (item: Omit<PosMenuItem, 'id'> & {id?: string}) => Promise<string>;
  deleteMenuItem: (id: string) => Promise<void>;

  sales: PosSale[];
  addSale: (input: {
    items: PosSale['items'];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: PosSalePaymentMethod;
  }) => Promise<string>;

  categories: string[];
  reload: () => Promise<void>;
};

const PosContext = createContext<PosState | null>(null);

const DEFAULT_ACCOUNT: PosAccount = {
  displayName: 'Kasir',
  storeName: 'Anti Rugi',
};

export function PosProvider({children}: {children: ReactNode}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [account, setAccountState] = useState<PosAccount>(DEFAULT_ACCOUNT);
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [sales, setSales] = useState<PosSale[]>([]);

  const reload = async () => {
    setError(null);
    setLoading(true);
    try {
      const [me, menu, salesResp] = await Promise.all([
        apiFetch<PosAccount>('/api/me'),
        apiFetch<{items: PosMenuItem[]}>('/api/pos/menu'),
        apiFetch<{sales: PosSale[]}>('/api/pos/sales'),
      ]);
      setAccountState(me);
      setMenuItems(menu.items);
      setSales(salesResp.sales);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data POS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAccount: PosState['setAccount'] = async (next) => {
    const updated = await apiFetch<PosAccount>('/api/pos/account', {
      method: 'PUT',
      body: JSON.stringify(next),
    });
    setAccountState(updated);
  };

  const upsertMenuItem: PosState['upsertMenuItem'] = async (item) => {
    const payload = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category,
      isActive: item.isActive,
    };

    const resp = await apiFetch<{item: PosMenuItem}>('/api/pos/menu/upsert', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const upserted = resp.item;
    setMenuItems((prev) => {
      const idx = prev.findIndex((p) => p.id === upserted.id);
      if (idx === -1) return [upserted, ...prev];
      return prev.map((p) => (p.id === upserted.id ? upserted : p));
    });
    return upserted.id;
  };

  const deleteMenuItem: PosState['deleteMenuItem'] = async (id) => {
    await apiFetch('/api/pos/menu/' + id, {method: 'DELETE'});
    setMenuItems((prev) => prev.filter((p) => p.id !== id));
  };

  const addSale: PosState['addSale'] = async (input) => {
    const resp = await apiFetch<{sale: PosSale}>('/api/pos/sales', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    const sale = resp.sale;
    setSales((prev) => [sale, ...prev]);
    return sale.id;
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of menuItems) {
      if (!item.isActive) continue;
      set.add(item.category);
    }
    return ['Semua', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'id'))];
  }, [menuItems]);

  const value: PosState = useMemo(
    () => ({
      loading,
      error,
      account,
      setAccount,
      menuItems,
      upsertMenuItem,
      deleteMenuItem,
      sales,
      addSale,
      categories,
      reload,
    }),
    [loading, error, account, menuItems, sales, categories],
  );

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos() {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error('usePos must be used within PosProvider');
  return ctx;
}

