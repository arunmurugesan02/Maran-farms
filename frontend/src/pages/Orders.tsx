import { useOrders } from '@/context/OrderContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Package, ShoppingBag, ChevronRight, CheckCircle2, Clock, Truck as TruckIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: 'bg-farm-gold/15 text-farm-brown border-farm-gold/30', icon: Clock, label: 'Pending' },
  confirmed: { color: 'bg-accent text-primary border-primary/20', icon: CheckCircle2, label: 'Confirmed' },
  shipped: { color: 'bg-secondary text-secondary-foreground border-secondary', icon: TruckIcon, label: 'Shipped' },
  delivered: { color: 'bg-primary/10 text-primary border-primary/20', icon: Package, label: 'Delivered' },
};

const Orders = () => {
  const { orders, fetchOrders, isOrdersLoading } = useOrders();
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  if (!user) {
    return (
      <div className="container py-24 text-center">
        <h2 className="text-2xl font-display text-foreground mb-3">Please login to view your orders</h2>
        <Link to="/login"><Button className="rounded-xl h-11 px-8">Login</Button></Link>
      </div>
    );
  }

  if (isOrdersLoading) {
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
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Start shopping to place your first order!</p>
          <Link to="/shop"><Button className="rounded-xl h-11 px-8">Shop Now</Button></Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="text-3xl font-display text-foreground mb-2">My Orders</h1>
      <p className="text-muted-foreground text-sm mb-8">{orders.length} order{orders.length > 1 ? 's' : ''}</p>

      <div className="space-y-4">
        {orders.map((order, i) => {
          const status = statusConfig[order.orderStatus] || statusConfig.pending;
          const StatusIcon = status.icon;
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
                    <p className="text-xs text-muted-foreground font-mono">{order.id}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                    <span className="text-lg font-bold text-foreground">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Order progress */}
                <div className="flex items-center gap-1 mb-5">
                  {['pending', 'confirmed', 'shipped', 'delivered'].map((s, idx) => {
                    const steps = ['pending', 'confirmed', 'shipped', 'delivered'];
                    const currentIdx = steps.indexOf(order.orderStatus);
                    const isCompleted = idx <= currentIdx;
                    return (
                      <div key={s} className={`flex-1 h-1.5 rounded-full ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
                    );
                  })}
                </div>

                <div className="space-y-2">
                  {order.items.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <img src={item.product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
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
