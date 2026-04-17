import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  createProductApi,
  deleteProductApi,
  getAdminAnalyticsApi,
  getAllOrdersApi,
  getProductsApi,
  updateOrderStatusApi,
  updateProductApi
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const orderStatusTransitionMap = {
  pending: ["packed", "cancelled"],
  packed: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
} as const;

const Admin = () => {
  const { isAdmin, user, logout, isAuthLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders">("dashboard");
  const [productForm, setProductForm] = useState({
    name: "",
    type: "grass",
    price: 0,
    stock: 0,
    minQty: 1,
    lowStockThreshold: 10,
    deliveryType: "delivery",
    description: "",
    category: "Grass"
  });

  const productsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => getProductsApi(),
    refetchInterval: false
  });

  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getAllOrdersApi,
    refetchInterval: () => (document.visibilityState === "visible" ? 4_000 : false)
  });

  const analyticsQuery = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: getAdminAnalyticsApi,
    refetchInterval: () => (document.visibilityState === "visible" ? 10_000 : false)
  });

  const saveProductMutation = useMutation({
    mutationFn: () =>
      createProductApi({
        ...productForm,
        type: productForm.type as "grass" | "animal",
        deliveryType: productForm.deliveryType as "delivery" | "pickup" | "both",
        images: ["https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600"],
        videos: []
      }),
    onSuccess: async () => {
      await productsQuery.refetch();
      setProductForm({
        name: "",
        type: "grass",
        price: 0,
        stock: 0,
        minQty: 1,
        lowStockThreshold: 10,
        deliveryType: "delivery",
        description: "",
        category: "Grass"
      });
      toast({ title: "Product added" });
    }
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, price, stock, lowStockThreshold }: { id: string; price: number; stock: number; lowStockThreshold: number }) =>
      updateProductApi(id, { price, stock, lowStockThreshold }),
    onSuccess: async () => {
      await Promise.all([productsQuery.refetch(), analyticsQuery.refetch()]);
      toast({ title: "Inventory updated" });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => deleteProductApi(id),
    onSuccess: async () => {
      await productsQuery.refetch();
      toast({ title: "Product deleted" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => updateOrderStatusApi(id, { orderStatus: status }),
    onSuccess: async () => {
      await Promise.all([ordersQuery.refetch(), analyticsQuery.refetch()]);
      toast({ title: "Order status updated" });
    },
    onError: (error) => {
      toast({
        title: "Unable to update order status",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  });

  const customers = useMemo(() => {
    const source = ordersQuery.data || [];
    const map = new Map<string, { name: string; phone: string; orders: number; revenue: number }>();

    source.forEach((order) => {
      const key = order.user?.id || order.deliveryDetails?.phone || order.id;
      const row = map.get(key) || {
        name: order.user?.name || order.deliveryDetails?.fullName || "Customer",
        phone: order.user?.phone || order.deliveryDetails?.phone || "-",
        orders: 0,
        revenue: 0
      };
      row.orders += 1;
      row.revenue += order.totalAmount;
      map.set(key, row);
    });

    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [ordersQuery.data]);

  const handleLogout = () => {
    logout();
    toast({ title: "Logged out", description: "You have safely signed out from admin." });
    navigate("/login", { replace: true, state: { from: { pathname: "/admin" } } });
  };

  if (isAuthLoading) {
    return <div className="container py-10 text-sm text-muted-foreground">Checking admin access...</div>;
  }

  if (!isAdmin) return <Navigate to="/login" replace state={{ from: { pathname: "/admin" } }} />;

  const analytics = analyticsQuery.data;
  const products = productsQuery.data || [];
  const orders = ordersQuery.data || [];

  const chartData = [
    { name: "Daily", value: analytics?.sales?.daily || 0 },
    { name: "Weekly", value: analytics?.sales?.weekly || 0 },
    { name: "Monthly", value: analytics?.sales?.monthly || 0 }
  ];

  return (
    <div className="container py-8 space-y-6">
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin Console</p>
          <h1 className="text-xl font-semibold text-foreground">Welcome, {user?.name || "Admin"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="outline" size="sm">Back to store</Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["dashboard", "products", "orders"] as const).map((tab) => (
          <Button key={tab} variant={activeTab === tab ? "default" : "outline"} onClick={() => setActiveTab(tab)}>
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold text-foreground">{analytics?.totalOrders || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">₹{(analytics?.totalRevenue || 0).toFixed(2)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Low Stock Products</p>
              <p className="text-2xl font-bold text-foreground">{analytics?.lowStockProducts?.length || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Top Customers</p>
              <p className="text-2xl font-bold text-foreground">{customers.length}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 h-[320px]">
            <h3 className="font-semibold text-foreground mb-3">Sales Window</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-2">Top Selling Products</h3>
              <div className="space-y-2">
                {(analytics?.topProducts || []).map((item: any) => (
                  <div key={item.name} className="text-sm flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-2">Low Stock Alerts</h3>
              <div className="space-y-2">
                {(analytics?.lowStockProducts || []).map((item: any) => (
                  <div key={item._id} className="text-sm flex justify-between text-destructive">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.stock}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3">Customers</h3>
            <div className="space-y-2">
              {customers.slice(0, 8).map((item, idx) => (
                <div key={`${item.phone}-${idx}`} className="text-sm flex justify-between border-b border-border pb-2">
                  <span>{item.name} ({item.phone})</span>
                  <span>{item.orders} orders · ₹{item.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Add Product</h3>
            <div className="grid md:grid-cols-2 gap-2">
              <input className="border border-border rounded-lg px-3 py-2 bg-background" placeholder="Name" value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} />
              <input className="border border-border rounded-lg px-3 py-2 bg-background" placeholder="Price" type="number" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: Number(e.target.value) }))} />
              <input className="border border-border rounded-lg px-3 py-2 bg-background" placeholder="Stock" type="number" value={productForm.stock} onChange={(e) => setProductForm((p) => ({ ...p, stock: Number(e.target.value) }))} />
              <input className="border border-border rounded-lg px-3 py-2 bg-background" placeholder="Min Qty" type="number" value={productForm.minQty} onChange={(e) => setProductForm((p) => ({ ...p, minQty: Number(e.target.value) }))} />
              <input className="border border-border rounded-lg px-3 py-2 bg-background" placeholder="Low-stock threshold" type="number" value={productForm.lowStockThreshold} onChange={(e) => setProductForm((p) => ({ ...p, lowStockThreshold: Number(e.target.value) }))} />
              <input className="border border-border rounded-lg px-3 py-2 bg-background" placeholder="Category" value={productForm.category} onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))} />
            </div>
            <textarea className="border border-border rounded-lg px-3 py-2 bg-background w-full" placeholder="Description" value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} />
            <Button onClick={() => saveProductMutation.mutate()} disabled={saveProductMutation.isPending}>
              {saveProductMutation.isPending ? "Saving..." : "Save Product"}
            </Button>
          </div>

          <div className="space-y-2">
            {products.map((product) => (
              <ProductInventoryRow
                key={product.id}
                product={product}
                onSave={(price, stock, lowStockThreshold) =>
                  updateStockMutation.mutate({ id: product.id, price, stock, lowStockThreshold })
                }
                onDelete={() => deleteProductMutation.mutate(product.id)}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{order.orderNumber || order.id}</p>
                  <p className="text-xs text-muted-foreground">{order.user?.name || order.deliveryDetails?.fullName || "Customer"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">₹{order.totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{order.orderStatus}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(["packed", "shipped", "delivered", "cancelled"] as const).map((status) => {
                  const allowedStatuses = orderStatusTransitionMap[order.orderStatus as keyof typeof orderStatusTransitionMap] || [];
                  const isCurrent = order.orderStatus === status;
                  const isAllowedTransition = allowedStatuses.includes(status);
                  const isDisabled = updateStatusMutation.isPending || !isAllowedTransition;

                  return (
                    <Button
                      key={status}
                      variant={isCurrent ? "default" : "outline"}
                      size="sm"
                      disabled={isDisabled}
                      onClick={() => updateStatusMutation.mutate({ id: order.id, status })}
                    >
                      {isCurrent ? "Current" : `Mark ${status}`}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductInventoryRow = ({
  product,
  onSave,
  onDelete
}: {
  product: any;
  onSave: (price: number, stock: number, lowStockThreshold: number) => void;
  onDelete: () => void;
}) => {
  const [price, setPrice] = useState(product.price);
  const [stock, setStock] = useState(product.stock);
  const [threshold, setThreshold] = useState(product.lowStockThreshold || 10);

  const lowStock = stock <= threshold;

  return (
    <div className={`bg-card border rounded-xl p-4 ${lowStock ? "border-destructive" : "border-border"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{product.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{product.type} · {product.deliveryType}</p>
        </div>
        {lowStock ? <span className="text-xs text-destructive font-semibold">Low stock</span> : null}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <input className="border border-border rounded-lg px-2 py-1.5 text-sm bg-background" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        <input className="border border-border rounded-lg px-2 py-1.5 text-sm bg-background" type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
        <input className="border border-border rounded-lg px-2 py-1.5 text-sm bg-background" type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => onSave(price, stock, threshold)}>Save</Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>Delete</Button>
      </div>
    </div>
  );
};

export default Admin;
