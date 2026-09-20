'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type CartItem = {
  key: string; productId: string; slug: string; name: string; image: string | null;
  unitPrice: number; qty: number; selections: Record<string, string>; customText: string;
  optionsLabel: { group: string; value: string }[];
};
type Ctx = {
  items: CartItem[]; count: number; subtotal: number; ready: boolean;
  add: (i: Omit<CartItem, 'key'>) => void; setQty: (key: string, q: number) => void;
  remove: (key: string) => void; clear: () => void;
};
const C = createContext<Ctx>(null as any);
export const useCart = () => useContext(C);
const KEY = 'laetia-cart-v1';

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch {}
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(items)); }, [items, ready]);

  const add = useCallback((i: Omit<CartItem, 'key'>) => {
    const key = [i.productId, JSON.stringify(i.selections), i.customText.trim().toLowerCase()].join('|');
    setItems((cur) => {
      const found = cur.find((x) => x.key === key);
      return found ? cur.map((x) => (x.key === key ? { ...x, qty: Math.min(x.qty + i.qty, 50) } : x)) : [...cur, { ...i, key }];
    });
  }, []);
  const setQty = (key: string, q: number) => setItems((c) => c.map((x) => (x.key === key ? { ...x, qty: Math.max(1, Math.min(50, q)) } : x)));
  const remove = (key: string) => setItems((c) => c.filter((x) => x.key !== key));
  const clear = () => setItems([]);
  const count = items.reduce((a, i) => a + i.qty, 0);
  const subtotal = items.reduce((a, i) => a + i.qty * i.unitPrice, 0);

  return <C.Provider value={{ items, count, subtotal, ready, add, setQty, remove, clear }}>{children}</C.Provider>;
}
