import React, { createContext, useCallback, useContext, useState } from "react";
import { Order } from "@/types";
import { getMyOrdersApi } from "@/lib/api";
import { STORAGE_KEYS } from "@/lib/storage";

interface OrderContextType {
  orders: Order[];
  isOrdersLoading: boolean;
  fetchOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.orderSnapshots);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  });
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsOrdersLoading(true);
    try {
      const myOrders = await getMyOrdersApi();
      setOrders(myOrders);
      localStorage.setItem(STORAGE_KEYS.orderSnapshots, JSON.stringify(myOrders.slice(0, 20)));
    } catch (_error) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.orderSnapshots);
        const parsed = raw ? JSON.parse(raw) : [];
        setOrders(Array.isArray(parsed) ? parsed : []);
      } catch (_innerError) {
        setOrders([]);
      }
    } finally {
      setIsOrdersLoading(false);
    }
  }, []);

  return (
    <OrderContext.Provider value={{ orders, isOrdersLoading, fetchOrders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
};
