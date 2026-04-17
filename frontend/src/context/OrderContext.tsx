import React, { createContext, useCallback, useContext, useState } from "react";
import { Order } from "@/types";
import { getMyOrdersApi } from "@/lib/api";

interface OrderContextType {
  orders: Order[];
  isOrdersLoading: boolean;
  fetchOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsOrdersLoading(true);
    try {
      const myOrders = await getMyOrdersApi();
      setOrders(myOrders);
    } catch (_error) {
      setOrders([]);
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
