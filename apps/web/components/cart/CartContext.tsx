"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type CartItem = {
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
};

type CartContextValue = CartState & {
  isOpen: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  setNote: (value: string) => void;
  setPromoCode: (value: string) => void;
  setDeliveryTime: (value: string) => void;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const storageKey = "ttc_cart";

const emptyState: CartState = {
  items: [],
  note: "",
  promoCode: "",
  deliveryTime: ""
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(emptyState.items);
  const [note, setNote] = useState(emptyState.note);
  const [promoCode, setPromoCode] = useState(emptyState.promoCode);
  const [deliveryTime, setDeliveryTime] = useState(emptyState.deliveryTime);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as CartState;
      setItems(parsed.items || []);
      setNote(parsed.note || "");
      setPromoCode(parsed.promoCode || "");
      setDeliveryTime(parsed.deliveryTime || "");
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const payload: CartState = { items, note, promoCode, deliveryTime };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [items, note, promoCode, deliveryTime]);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        );
      }

      return [...prev, { ...item, quantity: 1 }];
    });
    setIsOpen(true);
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    setNote("");
    setPromoCode("");
    setDeliveryTime("");
  };

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      note,
      promoCode,
      deliveryTime,
      isOpen,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      setNote,
      setPromoCode,
      setDeliveryTime,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false)
    }),
    [items, note, promoCode, deliveryTime, isOpen, itemCount, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
