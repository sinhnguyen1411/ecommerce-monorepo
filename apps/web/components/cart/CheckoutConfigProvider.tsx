"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { CheckoutConfig } from "@/lib/api";
import { siteConfig } from "@/lib/site";

const fallbackCheckoutConfig: CheckoutConfig = {
  min_order_amount: siteConfig.minOrderAmount,
  free_shipping_threshold: siteConfig.freeShippingThreshold,
  shipping_fee_standard: 30000,
  shipping_fee_express: 50000
};

const CheckoutConfigContext = createContext<CheckoutConfig>(fallbackCheckoutConfig);

export default function CheckoutConfigProvider({
  children,
  initialConfig
}: {
  children: ReactNode;
  initialConfig?: CheckoutConfig | null;
}) {
  return (
    <CheckoutConfigContext.Provider value={initialConfig || fallbackCheckoutConfig}>
      {children}
    </CheckoutConfigContext.Provider>
  );
}

export function useCheckoutConfig() {
  return useContext(CheckoutConfigContext);
}
