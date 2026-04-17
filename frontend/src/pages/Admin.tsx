import { useEffect, useMemo, useState } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, Package, Users, BarChart3, Settings, LogOut,
  Image, Bell, TrendingUp, ShoppingCart, DollarSign, Eye,
  ChevronRight, X, Menu
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminOrder, createProductApi, deleteProductApi, getAllOrdersApi, getProductsApi, updateProductApi } from '@/lib/api';
import logo from '@/images/logo.png';
import { BRAND_NAME, BRAND_PHONE_DISPLAY } from '@/lib/brand';

const sidebarLinks = [
  { icon: BarChart3, label: 'Dashboard', key: 'dashboard' },
  { icon: Package, label: 'Products', key: 'products' },
  { icon: ShoppingCart, label: 'Orders', key: 'orders' },
  { icon: Users, label: 'Customers', key: 'customers' },
  { icon: Image, label: 'Media', key: 'media' },
  { icon: Settings, label: 'Settings', key: 'settings' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-farm-gold/15 text-farm-brown',
  confirmed: 'bg-accent text-primary',
  shipped: 'bg-secondary text-secondary-foreground',
  delivered: 'bg-primary/10 text-primary',
};

const ORDER_STATUSES = ['all', 'pending', 'confirmed', 'shipped', 'delivered'] as const;
type OrderFilter = typeof ORDER_STATUSES[number];

function formatCurrency(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatDate(input: string) {
  return new Date(input).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

const Admin = () => {
  const { isAdmin, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [ordersList, setOrdersList] = useState<AdminOrder[]>([]);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [isLoadingAdminData, setIsLoadingAdminData] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'grass' as 'grass' | 'animal', price: '', stock: '', minQty: '50',
    deliveryType: 'delivery' as 'delivery' | 'pickup' | 'both', description: '', age: '', health: '',
  });

  if (!isAdmin) return <Navigate to="/login" />;

  useEffect(() => {
    let mounted = true;
    async function loadAdminData() {
      try {
        const [products, orders] = await Promise.all([
          getProductsApi(),
          getAllOrdersApi(),
        ]);
        if (!mounted) return;
        setProductsList(products);
        setOrdersList(orders);
      } catch (error) {
        if (!mounted) return;
        toast({
          title: 'Failed to load admin data',
          description: error instanceof Error ? error.message : 'Please refresh and try again',
          variant: 'destructive',
        });
      } finally {
        if (mounted) setIsLoadingAdminData(false);
      }
    }
    loadAdminData();
    return () => {
      mounted = false;
    };
  }, [toast]);

  const filteredOrders = useMemo(
    () => (orderFilter === 'all' ? ordersList : ordersList.filter((o) => o.orderStatus === orderFilter)),
    [orderFilter, ordersList]
  );

  const totalRevenue = useMemo(
    () => ordersList.reduce((sum, order) => sum + order.totalAmount, 0),
    [ordersList]
  );

  const customersList = useMemo(() => {
    const map = new Map<string, { name: string; email: string; orders: number; spent: number; joined: string }>();
    for (const order of ordersList) {
      const name = order.user?.name || order.deliveryDetails?.fullName || 'Customer';
      const email = order.user?.email || order.deliveryDetails?.phone || '-';
      const key = order.user?.id || email || name;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          name,
          email,
          orders: 1,
          spent: order.totalAmount,
          joined: order.createdAt,
        });
        continue;
      }

      existing.orders += 1;
      existing.spent += order.totalAmount;
      if (new Date(order.createdAt) < new Date(existing.joined)) {
        existing.joined = order.createdAt;
      }
      map.set(key, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.spent - a.spent);
  }, [ordersList]);

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: 'Fill required fields', variant: 'destructive' });
      return;
    }
    const productPayload: Partial<Product> = {
      name: form.name, type: form.type, price: Number(form.price), unit: 'piece',
      stock: Number(form.stock), minQty: form.type === 'grass' ? Number(form.minQty) : 1,
      deliveryType: form.deliveryType, description: form.description,
      images: ['https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600'],
      videos: [], age: form.age, health: form.health,
      category: form.type === 'grass' ? 'Grass' : 'Animals',
    };
    try {
      if (editingId) {
        const updated = await updateProductApi(editingId, productPayload);
        setProductsList(prev => prev.map(p => p.id === editingId ? updated : p));
        toast({ title: '✅ Product updated' });
      } else {
        const created = await createProductApi(productPayload);
        setProductsList(prev => [...prev, created]);
        toast({ title: '✅ Product added' });
      }
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
      return;
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', type: 'grass', price: '', stock: '', minQty: '50', deliveryType: 'delivery', description: '', age: '', health: '' });
  };

  const handleEdit = (p: Product) => {
    setForm({ name: p.name, type: p.type, price: String(p.price), stock: String(p.stock), minQty: String(p.minQty), deliveryType: p.deliveryType, description: p.description, age: p.age || '', health: p.health || '' });
    setEditingId(p.id);
    setShowForm(true);
    setActiveTab('products');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProductApi(id);
      setProductsList(prev => prev.filter(p => p.id !== id));
      toast({ title: '🗑️ Product deleted' });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const dashboardStats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), change: 'Live', icon: DollarSign, color: 'bg-primary/10 text-primary' },
    { label: 'Total Orders', value: String(ordersList.length), change: 'Live', icon: ShoppingCart, color: 'bg-farm-gold/15 text-farm-brown' },
    { label: 'Total Products', value: String(productsList.length), change: 'Live', icon: Package, color: 'bg-accent text-primary' },
    { label: 'Total Customers', value: String(customersList.length), change: 'Live', icon: Users, color: 'bg-secondary text-secondary-foreground' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-card border-r border-border p-5 hidden md:flex flex-col">
        <div className="flex items-center gap-3 mb-8 pb-5 border-b border-border">
          <img src={logo} alt={BRAND_NAME} className="h-10 w-10 rounded-full object-cover border border-border" />
          <div>
            <p className="font-display font-bold text-sm text-foreground">{BRAND_NAME}</p>
            <p className="text-[10px] font-semibold text-primary tracking-wider">ADMIN PANEL</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {sidebarLinks.map((l) => (
            <button
              key={l.key}
              onClick={() => setActiveTab(l.key)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === l.key
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </button>
          ))}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-4"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-5 z-50 md:hidden flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <img src={logo} alt={BRAND_NAME} className="h-9 w-9 rounded-full object-cover border border-border" />
                  <span className="font-display font-bold text-sm">ADMIN</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              <nav className="space-y-1 flex-1">
                {sidebarLinks.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => { setActiveTab(l.key); setSidebarOpen(false); }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === l.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </button>
                ))}
              </nav>
              <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="flex-1 bg-muted/30">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-display font-bold text-foreground capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center hover:bg-accent transition-colors relative">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <div className="h-9 w-9 rounded-xl farm-gradient flex items-center justify-center text-primary-foreground text-xs font-bold">
              A
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardStats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-2xl border border-border/50 p-5 hover-lift"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={`h-10 w-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3" /> {stat.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Recent orders */}
              <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-5 flex justify-between items-center border-b border-border">
                  <h3 className="font-display font-bold text-foreground">Recent Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                    View All <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Order ID</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Customer</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Amount</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Status</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersList.slice(0, 5).map((o) => (
                        <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs text-foreground">{o.id.slice(-8).toUpperCase()}</td>
                          <td className="p-3">
                            <p className="font-medium text-foreground text-xs">{o.user?.name || o.deliveryDetails?.fullName || 'Customer'}</p>
                            <p className="text-[10px] text-muted-foreground">{o.user?.email || o.deliveryDetails?.phone || '-'}</p>
                          </td>
                          <td className="p-3 font-semibold text-foreground text-xs">{formatCurrency(o.totalAmount)}</td>
                          <td className="p-3">
                            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full capitalize ${statusColors[o.orderStatus]}`}>{o.orderStatus}</span>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">{formatDate(o.createdAt)}</td>
                        </tr>
                      ))}
                      {!isLoadingAdminData && ordersList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-xs text-muted-foreground">No orders yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-card rounded-2xl border border-border/50 p-5">
                  <h3 className="font-display font-bold text-foreground mb-4">Top Products</h3>
                  <div className="space-y-3">
                    {productsList.slice(0, 4).map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                        <img src={p.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">₹{p.price}/{p.unit}</p>
                        </div>
                        <span className="text-xs font-semibold text-primary">{p.stock} in stock</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border/50 p-5">
                  <h3 className="font-display font-bold text-foreground mb-4">Recent Customers</h3>
                  <div className="space-y-3">
                    {customersList.slice(0, 4).map((c, i) => (
                      <div key={`${c.email}-${i}`} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-xs">
                          {c.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">{c.email}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{c.orders} orders</span>
                      </div>
                    ))}
                    {!isLoadingAdminData && customersList.length === 0 && (
                      <p className="text-xs text-muted-foreground">No customers yet</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{productsList.length} products total</p>
                </div>
                <Button onClick={() => { setShowForm(true); setEditingId(null); }} className="rounded-xl gap-1.5">
                  <Plus className="h-4 w-4" /> Add Product
                </Button>
              </div>

              {/* Product form */}
              <AnimatePresence>
                {showForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-card rounded-2xl border border-border/50 p-6 space-y-5"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-display font-bold text-foreground">{editingId ? 'Edit' : 'Add New'} Product</h3>
                      <button onClick={() => { setShowForm(false); setEditingId(null); }}>
                        <X className="h-5 w-5 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Product Name *</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
                        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                          <option value="grass">🌿 Grass</option>
                          <option value="animal">🐾 Animal</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Price (₹) *</label>
                        <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Stock</label>
                        <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      </div>
                      {form.type === 'grass' && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Minimum Qty</label>
                          <input type="number" value={form.minQty} onChange={e => setForm(f => ({ ...f, minQty: e.target.value }))} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Delivery Type</label>
                        <select value={form.deliveryType} onChange={e => setForm(f => ({ ...f, deliveryType: e.target.value as any }))} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                          <option value="delivery">Delivery</option>
                          <option value="pickup">Pickup</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                      {form.type === 'animal' && (
                        <>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Age</label>
                            <input value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Health</label>
                            <input value={form.health} onChange={e => setForm(f => ({ ...f, health: e.target.value }))} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                      <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground h-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4 border border-dashed border-border">
                      <div className="text-center py-4">
                        <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Drag & drop images/videos or click to upload</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Connect Cloudinary for production</p>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" className="rounded-xl" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
                      <Button className="rounded-xl" onClick={handleSave}>
                        {editingId ? 'Update' : 'Add'} Product
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Product grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {productsList.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card rounded-2xl border border-border/50 overflow-hidden hover-lift group"
                  >
                    <div className="relative">
                      <img src={p.images[0]} alt={p.name} className="w-full h-36 object-cover" />
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-card/90 backdrop-blur-sm">
                          {p.type === 'grass' ? '🌿' : '🐾'} {p.type}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(p)} className="h-7 w-7 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card">
                          <Pencil className="h-3 w-3 text-foreground" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="h-7 w-7 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/80 hover:text-destructive-foreground">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-display font-semibold text-foreground text-sm">{p.name}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-bold text-primary">₹{p.price}/{p.unit}</span>
                        <span className="text-xs text-muted-foreground">{p.stock} in stock</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-5 border-b border-border flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{filteredOrders.length} orders</p>
                  <div className="flex gap-2">
                    {ORDER_STATUSES.map(s => (
                      <button
                        key={s}
                        onClick={() => setOrderFilter(s)}
                        className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
                          orderFilter === s
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Order ID</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Customer</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Items</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Amount</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Status</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Date</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o) => (
                        <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs font-medium text-foreground">{o.id.slice(-8).toUpperCase()}</td>
                          <td className="p-3">
                            <p className="font-medium text-foreground text-xs">{o.user?.name || o.deliveryDetails?.fullName || 'Customer'}</p>
                            <p className="text-[10px] text-muted-foreground">{o.user?.email || o.deliveryDetails?.phone || '-'}</p>
                          </td>
                          <td className="p-3 text-xs text-foreground">{o.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                          <td className="p-3 font-semibold text-foreground text-xs">{formatCurrency(o.totalAmount)}</td>
                          <td className="p-3">
                            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[o.orderStatus]}`}>{o.orderStatus}</span>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">{formatDate(o.createdAt)}</td>
                          <td className="p-3">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {!isLoadingAdminData && filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-xs text-muted-foreground">No orders found for this filter</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-5 border-b border-border">
                  <p className="text-sm text-muted-foreground">{customersList.length} customers</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Customer</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Orders</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Total Spent</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customersList.map((c, i) => (
                        <tr key={`${c.email}-${i}`} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-xs">
                                {c.name[0]}
                              </div>
                              <div>
                                <p className="font-medium text-foreground text-xs">{c.name}</p>
                                <p className="text-[10px] text-muted-foreground">{c.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-foreground text-xs font-medium">{c.orders}</td>
                          <td className="p-3 font-semibold text-foreground text-xs">{formatCurrency(c.spent)}</td>
                          <td className="p-3 text-muted-foreground text-xs">{formatDate(c.joined)}</td>
                        </tr>
                      ))}
                      {!isLoadingAdminData && customersList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-xs text-muted-foreground">No customers yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Media Library</p>
                <Button className="rounded-xl gap-1.5"><Plus className="h-4 w-4" /> Upload</Button>
              </div>
              <div className="bg-card rounded-2xl border border-border/50 p-8 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Image className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-2">Media Management</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload and manage product images & videos. Connect Cloudinary for production-ready media storage.
                  </p>
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    {productsList.slice(0, 6).map(p => (
                      <div key={p.id} className="aspect-square rounded-xl overflow-hidden border border-border">
                        <img src={p.images[0]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-5">
                <h3 className="font-display font-bold text-foreground">Store Settings</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { label: 'Store Name', value: BRAND_NAME },
                    { label: 'Email', value: 'admin@maranfarms.com' },
                    { label: 'Phone', value: BRAND_PHONE_DISPLAY },
                    { label: 'Location', value: 'Madurai, Tamil Nadu' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{f.label}</label>
                      <input defaultValue={f.value} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                  ))}
                </div>
                <Button className="rounded-xl">Save Changes</Button>
              </div>

              <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-5">
                <h3 className="font-display font-bold text-foreground">Integrations</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Razorpay', desc: 'Payment processing', connected: false },
                    { name: 'Cloudinary', desc: 'Media storage', connected: false },
                    { name: 'MongoDB Atlas', desc: 'Database', connected: false },
                  ].map((i) => (
                    <div key={i.name} className="flex justify-between items-center p-4 rounded-xl border border-border">
                      <div>
                        <p className="font-medium text-foreground text-sm">{i.name}</p>
                        <p className="text-xs text-muted-foreground">{i.desc}</p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl text-xs">
                        {i.connected ? 'Connected' : 'Connect'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
