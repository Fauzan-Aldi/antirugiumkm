export type PosMenuItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  isActive: boolean;
};

export type PosCartItem = PosMenuItem & {
  quantity: number;
};

export type PosSalePaymentMethod = 'tunai' | 'transfer';

export type PosSale = {
  id: string;
  createdAt: string; // ISO
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PosSalePaymentMethod;
};

export type PosAccount = {
  displayName: string;
  storeName: string;
  subscriptionExpiresAt?: string; // ISO
  isAdmin?: boolean;
};

