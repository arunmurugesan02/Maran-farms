import { ChangeEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  createMediaUploadSignatureApi,
  createProductApi,
  deleteProductApi,
  getAdminAnalyticsApi,
  getAllOrdersApi,
  getProductsApi,
  updateOrderStatusApi,
  updateProductApi
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Upload, Image as ImageIcon, Video, Package, IndianRupee, ShoppingCart, LayoutDashboard, XCircle, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const orderStatusTransitionMap = {
  pending: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: []
} as const;

const fieldClassName =
  "h-11 w-full rounded-xl border border-border/70 bg-background px-3 text-base text-foreground shadow-sm outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/20 md:text-sm";

const Admin = () => {
  const { isAdmin, user, logout, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders">("dashboard");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    type: "grass",
    unit: "pcs",
    price: 0,
    stock: 0,
    minQty: 1,
    lowStockThreshold: 10,
    deliveryType: "delivery",
    description: "",
    category: "Grass",
    images: [] as string[],
    videos: [] as string[]
  });

  const productsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => getProductsApi(),
    refetchInterval: false
  });
  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getAllOrdersApi,
    refetchInterval: () => (document.visibilityState === "visible" ? 5_000 : false)
  });
  const analyticsQuery = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: getAdminAnalyticsApi,
    refetchInterval: () => (document.visibilityState === "visible" ? 12_000 : false)
  });

  const saveProductMutation = useMutation({
    mutationFn: () =>
      createProductApi({
        ...productForm,
        type: productForm.type as "grass" | "animal",
        deliveryType: productForm.deliveryType as "delivery" | "pickup" | "both"
      }),
    onSuccess: async () => {
      await productsQuery.refetch();
      setProductForm({
        name: "",
        type: "grass",
        unit: "pcs",
        price: 0,
        stock: 0,
        minQty: 1,
        lowStockThreshold: 10,
        deliveryType: "delivery",
        description: "",
        category: "Grass",
        images: [],
        videos: []
      });
      toast.success("Product created");
    },
    onError: (error) => {
      toast.error("Unable to create product", {
        description: error instanceof Error ? error.message : "Please check inputs"
      });
    }
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, price, stock, lowStockThreshold }: { id: string; price: number; stock: number; lowStockThreshold: number }) =>
      updateProductApi(id, { price, stock, lowStockThreshold }),
    onSuccess: async () => {
      await Promise.all([productsQuery.refetch(), analyticsQuery.refetch()]);
      toast.success("Inventory updated");
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => deleteProductApi(id),
    onSuccess: async () => {
      await productsQuery.refetch();
      toast.success("Product deleted");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: any; note?: string }) =>
      updateOrderStatusApi(id, { orderStatus: status, note }),
    onSuccess: async () => {
      await Promise.all([ordersQuery.refetch(), analyticsQuery.refetch()]);
      toast.success("Order updated");
    },
    onError: (error) => {
      toast.error("Unable to update order", {
        description: error instanceof Error ? error.message : "Please try again"
      });
    }
  });

  const uploadMediaToCloudinary = async (file: File, resourceType: "image" | "video") => {
    const sign = await createMediaUploadSignatureApi({ resourceType });
    const uploadUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/${resourceType}/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sign.apiKey);
    formData.append("timestamp", String(sign.timestamp));
    formData.append("signature", sign.signature);
    formData.append("folder", sign.folder);
    formData.append("public_id", sign.publicId);

    const response = await fetch(uploadUrl, { method: "POST", body: formData });
    if (!response.ok) {
      const fallback = "Upload failed";
      try {
        const payload = await response.json();
        throw new Error(payload?.error?.message || fallback);
      } catch (_error) {
        if (_error instanceof Error && _error.message) {
          throw _error;
        }
        throw new Error(fallback);
      }
    }
    const json = await response.json();
    return json.secure_url as string;
  };

  const handleUploadFile = async (input: ChangeEvent<HTMLInputElement>, resourceType: "image" | "video") => {
    const file = input.target.files?.[0];
    if (!file) return;

    try {
      if (resourceType === "image") setIsUploadingImage(true);
      if (resourceType === "video") setIsUploadingVideo(true);

      const url = await uploadMediaToCloudinary(file, resourceType);
      setProductForm((prev) => ({
        ...prev,
        images: resourceType === "image" ? [...prev.images, url] : prev.images,
        videos: resourceType === "video" ? [...prev.videos, url] : prev.videos
      }));
      toast.success(`${resourceType === "image" ? "Image" : "Video"} uploaded`);
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Please retry"
      });
    } finally {
      input.target.value = "";
      setIsUploadingImage(false);
      setIsUploadingVideo(false);
    }
  };

  const customers = useMemo(() => {
    const source = ordersQuery.data || [];
    const map = new Map<string, { name: string; orders: number; revenue: number }>();

    source.forEach((order) => {
      const key = order.user?.id || order.deliveryDetails?.phone || order.id;
      const row = map.get(key) || { name: order.user?.name || order.deliveryDetails?.fullName || "Customer", orders: 0, revenue: 0 };
      row.orders += 1;
      row.revenue += order.totalAmount;
      map.set(key, row);
    });

    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [ordersQuery.data]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login", { replace: true, state: { from: { pathname: "/admin" } } });
  };

  if (isAuthLoading) return <div className="container py-10 text-sm text-muted-foreground">Checking admin access...</div>;
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
    <div className="container py-5 md:py-8 space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/95 p-5 md:p-7 shadow-lg">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-emerald-500/10 blur-xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Admin Console</p>
            <h1 className="text-xl md:text-3xl font-semibold text-foreground">Welcome, {user?.name || "Admin"}</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor sales, manage inventory, and process orders in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/"><Button variant="outline" size="sm">Back to Store</Button></Link>
            <Button variant="destructive" size="sm" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border/70 bg-muted/30 p-1.5">
        {([
          { key: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
          { key: "products", icon: Package, label: "Products" },
          { key: "orders", icon: ShoppingCart, label: "Orders" }
        ] as const).map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.key)}
            className={`h-10 gap-1.5 rounded-xl ${activeTab === tab.key ? "shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatCard label="Total Orders" value={String(analytics?.totalOrders || 0)} icon={ShoppingCart} />
            <StatCard label="Total Revenue" value={`₹${(analytics?.totalRevenue || 0).toFixed(2)}`} icon={IndianRupee} />
            <StatCard label="Low Stock" value={String(analytics?.lowStockProducts?.length || 0)} icon={Package} />
            <StatCard label="Top Customers" value={String(customers.length)} icon={Users} />
          </div>

          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
            <div className="bg-card border border-border/70 rounded-2xl p-4 h-[340px] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Sales Window</h3>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  Revenue trend
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-foreground mb-1">Top Customers</h3>
              <p className="text-xs text-muted-foreground mb-4">Ranked by total revenue contribution.</p>
              <div className="space-y-2.5">
                {customers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Customer analytics will appear after orders are placed.</p>
                ) : (
                  customers.map((customer, index) => (
                    <div key={`${customer.name}-${index}`} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[150px]">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.orders} order(s)</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">₹{customer.revenue.toFixed(2)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="bg-card border border-border/70 rounded-2xl p-4 md:p-5 space-y-4 shadow-sm">
            <h3 className="font-semibold text-foreground">Add Product</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <input className={fieldClassName} placeholder="Name" value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} />
              <input className={fieldClassName} placeholder="Unit (pcs/kg)" value={productForm.unit} onChange={(e) => setProductForm((p) => ({ ...p, unit: e.target.value }))} />
              <select className={fieldClassName} value={productForm.type} onChange={(e) => setProductForm((p) => ({ ...p, type: e.target.value }))}>
                <option value="grass">Grass</option>
                <option value="animal">Animal</option>
              </select>
              <input className={fieldClassName} placeholder="Price" type="number" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: Number(e.target.value) }))} />
              <input className={fieldClassName} placeholder="Stock" type="number" value={productForm.stock} onChange={(e) => setProductForm((p) => ({ ...p, stock: Number(e.target.value) }))} />
              <input className={fieldClassName} placeholder="Minimum Qty" type="number" value={productForm.minQty} onChange={(e) => setProductForm((p) => ({ ...p, minQty: Number(e.target.value) }))} />
              <input className={fieldClassName} placeholder="Low stock threshold" type="number" value={productForm.lowStockThreshold} onChange={(e) => setProductForm((p) => ({ ...p, lowStockThreshold: Number(e.target.value) }))} />
              <input className={fieldClassName} placeholder="Category" value={productForm.category} onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))} />
              <select className={fieldClassName} value={productForm.deliveryType} onChange={(e) => setProductForm((p) => ({ ...p, deliveryType: e.target.value }))}>
                <option value="delivery">Delivery</option>
                <option value="pickup">Pickup</option>
                <option value="both">Both</option>
              </select>
            </div>
            <textarea className={`${fieldClassName} min-h-[96px] py-2.5`} placeholder="Description" value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} />

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="border border-dashed border-border/70 rounded-xl p-3 bg-muted/30 cursor-pointer transition hover:bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> Upload Image</p>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadFile(e, "image")} />
                <p className="text-sm text-foreground">{isUploadingImage ? "Uploading..." : "Choose image file"}</p>
              </label>
              <label className="border border-dashed border-border/70 rounded-xl p-3 bg-muted/30 cursor-pointer transition hover:bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Upload Video</p>
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleUploadFile(e, "video")} />
                <p className="text-sm text-foreground">{isUploadingVideo ? "Uploading..." : "Choose video file"}</p>
              </label>
            </div>

            {productForm.images.length > 0 || productForm.videos.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Attached media</p>
                <div className="flex flex-wrap gap-2">
                  {productForm.images.map((url) => (
                    <span key={url} className="text-xs px-2 py-1 rounded-lg bg-accent text-primary">Image</span>
                  ))}
                  {productForm.videos.map((url) => (
                    <span key={url} className="text-xs px-2 py-1 rounded-lg bg-secondary text-secondary-foreground">Video</span>
                  ))}
                </div>
              </div>
            ) : null}

            <Button onClick={() => saveProductMutation.mutate()} disabled={saveProductMutation.isPending || isUploadingImage || isUploadingVideo} className="gap-1.5">
              <Upload className="h-4 w-4" />
              {saveProductMutation.isPending ? "Saving..." : "Save Product"}
            </Button>
          </div>

          <div className="space-y-2">
            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-card p-6 text-sm text-muted-foreground">
                No products yet. Add your first product from the form above.
              </div>
            ) : (
              products.map((product) => (
                <ProductInventoryRow
                  key={product.id}
                  product={product}
                  onSave={(price, stock, lowStockThreshold) =>
                    updateStockMutation.mutate({ id: product.id, price, stock, lowStockThreshold })
                  }
                  onDelete={() => deleteProductMutation.mutate(product.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card p-6 text-sm text-muted-foreground">
              No orders yet. Incoming orders will appear here.
            </div>
          ) : (
            orders.map((order) => {
              const allowedStatuses = orderStatusTransitionMap[order.orderStatus as keyof typeof orderStatusTransitionMap] || [];
              return (
                <div key={order.id} className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{order.orderNumber || order.id}</p>
                      <p className="text-xs text-muted-foreground">{order.user?.name || order.deliveryDetails?.fullName || "Customer"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">₹{order.totalAmount.toFixed(2)}</p>
                      <p className="inline-flex rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground capitalize">{order.orderStatus}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["packed", "shipped", "delivered"] as const).map((status) => (
                      <Button
                        key={status}
                        variant={order.orderStatus === status ? "default" : "outline"}
                        size="sm"
                        disabled={updateStatusMutation.isPending || !allowedStatuses.includes(status)}
                        onClick={() => updateStatusMutation.mutate({ id: order.id, status })}
                      >
                        {order.orderStatus === status ? "Current" : `Mark ${status}`}
                      </Button>
                    ))}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                      disabled={updateStatusMutation.isPending || !allowedStatuses.includes("cancelled")}
                      onClick={() => {
                        const reason = window.prompt("Cancel reason (optional):", "") || "";
                        updateStatusMutation.mutate({ id: order.id, status: "cancelled", note: reason });
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancel Order
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon }: { label: string; value: string; icon: any }) => (
  <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">{label}</p>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </span>
    </div>
    <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
  </div>
);

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

  return (
    <div className={`bg-card border rounded-2xl p-4 shadow-sm ${stock <= threshold ? "border-destructive/50" : "border-border/70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="h-12 w-12 rounded-lg object-cover" /> : null}
          <div>
            <p className="font-semibold text-foreground">{product.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{product.type} · {product.deliveryType}</p>
          </div>
        </div>
        <Button size="sm" variant="destructive" onClick={onDelete}>Delete</Button>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <input className={fieldClassName} type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        <input className={fieldClassName} type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
        <input className={fieldClassName} type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
      </div>
      <div className="mt-3">
        <Button size="sm" onClick={() => onSave(price, stock, threshold)}>Save Inventory</Button>
      </div>
    </div>
  );
};

export default Admin;
