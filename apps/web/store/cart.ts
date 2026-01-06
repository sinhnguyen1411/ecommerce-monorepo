import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  note: string;
  promoCode: string;
  deliveryTime: string;
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  incQty: (id: number) => void;
  decQty: (id: number) => void;
  setQty: (id: number, quantity: number) => void;
  clear: () => void;
  setNote: (value: string) => void;
  setPromoCode: (value: string) => void;
  setDeliveryTime: (value: string) => void;
  open: () => void;
  close: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      note: "",
      promoCode: "",
      deliveryTime: "",
      isOpen: false,
      addItem: (item) => {
        const items = get().items;
        const existing = items.find((entry) => entry.id === item.id);
        if (existing) {
          set({
            items: items.map((entry) =>
              entry.id === item.id
                ? { ...entry, quantity: entry.quantity + 1 }
                : entry
            ),
            isOpen: true
          });
          return;
        }

        set({ items: [...items, { ...item, quantity: 1 }], isOpen: true });
      },
      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
      incQty: (id) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item
          )
        });
      },
      decQty: (id) => {
        const items = get().items
          .map((item) =>
            item.id === id ? { ...item, quantity: item.quantity - 1 } : item
          )
          .filter((item) => item.quantity > 0);
        set({ items });
      },
      setQty: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((item) => item.id !== id) });
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          )
        });
      },
      clear: () => set({ items: [], note: "", promoCode: "", deliveryTime: "" }),
      setNote: (value) => set({ note: value }),
      setPromoCode: (value) => set({ promoCode: value }),
      setDeliveryTime: (value) => set({ deliveryTime: value }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false })
    }),
    {
      name: "ttc-cart",
      partialize: (state) => ({
        items: state.items,
        note: state.note,
        promoCode: state.promoCode,
        deliveryTime: state.deliveryTime
      })
    }
  )
);

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function getCartCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}
