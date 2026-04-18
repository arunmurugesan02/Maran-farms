import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Package,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck as TruckIcon,
  XCircle,
  FileDown,
  RotateCw
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { cancelOrderApi, downloadInvoiceApi, getMyOrdersApi, reorderApi } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { toast } from "@/components/ui/sonner";

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: "bg-farm-gold/15 text-farm-brown border-farm-gold/30", icon: Clock, label: "Pending" },
  packed: { color: "bg-accent text-primary border-primary/20", icon: Package, label: "Packed" },
  shipped: { color: "bg-secondary text-secondary-foreground border-secondary", icon: TruckIcon, label: "Shipped" },
  delivered: { color: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle2, label: "Delivered" },
  cancelled: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle, label: "Cancelled" }
};

const progressSteps = ["order_placed", "packed", "shipped", "delivered"] as const;

const Orders = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const {
    data: orders = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["my-orders"],
    queryFn: getMyOrdersApi,
    enabled: Boolean(user),
    refetchInterval: () => (document.visibilityState === "visible" ? 8_000 : false)
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => cancelOrderApi(orderId),
    onSuccess: () => {
      refetch();
      toast.success("Order cancelled");
    },
    onError: (error) => {
      toast.error("Cancellation failed", {
        description: error instanceof Error ? error.message : "Please try again"
      });
    }
  });

  const reorderMutation = useMutation({
    mutationFn: (orderId: string) => reorderApi(orderId),
    onSuccess: ({ items }) => {
      const matchedOrder = orders.find((order) =>
        order.items.length === items.length &&
        order.items.every((orderItem) => items.some((i) => i.productId === orderItem.product.id))
      );
      if (matchedOrder) {
        matchedOrder.items.forEach((item) => addToCart(item.product, item.quantity));
      }
      toast.success("Items added to cart");
    }
  });

  const downloadInvoice = async (orderId: string, orderNumber?: string) => {
    try {
      const blob = await downloadInvoiceApi(orderId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${orderNumber || orderId}-invoice.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Invoice unavailable", {
        description: error instanceof Error ? error.message : "Please try again"
      });
    }
  };

  if (!user) {
    return (
      <div className="container py-24 text-center">
        <h2 className="text-2xl font-display text-foreground mb-3">Please login to view your orders</h2>
        <Link to="/login">
          <Button className="rounded-xl h-11 px-8">Login</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-24 text-center">
        <p className="text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container py-24 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-display text-foreground mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Start shopping to place your first order.</p>
          <Link to="/shop">
            <Button className="rounded-xl h-11 px-8">Shop Now</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-display text-foreground mb-2">My Orders</h1>
      <p className="text-muted-foreground text-sm mb-8">{orders.length} order{orders.length > 1 ? "s" : ""}</p>

      <div className="space-y-4">
        {orders.map((order, i) => {
          const status = statusConfig[order.orderStatus] || statusConfig.pending;
          const StatusIcon = status.icon;
          const shouldShowProgress = order.paymentStatus === "paid" && order.orderStatus !== "cancelled";
          const progressIdx = (() => {
            if (!shouldShowProgress) return -1;
            if (order.orderStatus === "pending") return 0;
            if (order.orderStatus === "packed") return 1;
            if (order.orderStatus === "shipped") return 2;
            if (order.orderStatus === "delivered") return 3;
            return -1;
          })();
          const statusLabel =
            order.paymentStatus === "paid" && order.orderStatus === "pending" ? "Order Placed" : status.label;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border/50 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">{order.orderNumber || order.id}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </p>
                    {order.deliverySlot ? (
                      <p className="text-xs text-muted-foreground mt-1">Delivery slot: {order.deliverySlot}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusLabel}
                    </span>
                    <span className="text-lg font-bold text-foreground">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {shouldShowProgress ? (
                  <div className="mb-5">
                    <div className="flex items-center gap-1">
                      {progressSteps.map((step, idx) => {
                        const isCompleted = progressIdx >= 0 && idx <= progressIdx;
                        return <div key={step} className={`flex-1 h-1.5 rounded-full ${isCompleted ? "bg-primary" : "bg-border"}`} />;
                      })}
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-1 text-[11px] text-muted-foreground">
                      <span className={progressIdx >= 0 ? "text-foreground" : ""}>Order Placed</span>
                      <span className={progressIdx >= 1 ? "text-foreground" : ""}>Packed</span>
                      <span className={progressIdx >= 2 ? "text-foreground" : ""}>Shipped</span>
                      <span className={progressIdx >= 3 ? "text-foreground" : ""}>Delivered</span>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <img src={item.product.images[0]} alt="" loading="lazy" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {order.tracking?.milestones?.length ? (
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="text-xs font-semibold text-foreground mb-2">Tracking Timeline</p>
                    <div className="space-y-1">
                      {order.tracking.milestones.map((milestone, idx) => (
                        <p key={`${milestone.label}-${idx}`} className="text-xs text-muted-foreground">
                          {milestone.label} • {new Date(milestone.timestamp).toLocaleString("en-IN")}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.orderStatus === "pending" && order.paymentStatus !== "paid" ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => cancelMutation.mutate(order.id)}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel Order
                    </Button>
                  ) : null}

                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => reorderMutation.mutate(order.id)}
                    disabled={reorderMutation.isPending}
                  >
                    <RotateCw className="h-3.5 w-3.5" /> Re-order
                  </Button>

                  {order.paymentStatus === "paid" ? (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => downloadInvoice(order.id, order.orderNumber)}>
                      <FileDown className="h-3.5 w-3.5" /> Invoice
                    </Button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
