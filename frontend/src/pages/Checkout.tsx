import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, ChevronRight, CreditCard, Smartphone, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { createCheckoutOrderApi, getMeApi } from "@/lib/api";
import { BRAND_NAME } from "@/lib/brand";
import { STORAGE_KEYS } from "@/lib/storage";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function createIdempotencyKey() {
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const Checkout = () => {
  const { items, totalAmount, clearCart } = useCart();
  const { fetchOrders } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isPaying, setIsPaying] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    pincode: "",
    deliveryType: "delivery"
  });

  const deliveryCharge = totalAmount > 500 || form.deliveryType === "pickup" ? 0 : 40;

  useEffect(() => {
    if (items.length === 0) navigate("/cart");
  }, [items.length, navigate]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.checkoutDraft);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        couponCode?: string;
        selectedAddressId?: string;
        form?: typeof form;
      };
      if (parsed.form) {
        setForm((prev) => ({ ...prev, ...parsed.form }));
      }
      if (parsed.couponCode) {
        setCouponCode(parsed.couponCode);
      }
      if (parsed.selectedAddressId) {
        setSelectedAddressId(parsed.selectedAddressId);
      }
    } catch (_error) {
      // ignore invalid local draft
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    getMeApi()
      .then((me) => {
        if (!mounted) return;
        setAddresses(me.addresses || []);
        const defaultAddress = (me.addresses || []).find((item) => item.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
          setForm((prev) => ({
            ...prev,
            fullName: prev.fullName || defaultAddress.fullName || me.name || "",
            phone: prev.phone || defaultAddress.phone || me.phone || "",
            address: prev.address || defaultAddress.address || "",
            pincode: prev.pincode || defaultAddress.pincode || ""
          }));
        } else {
          setForm((prev) => ({
            ...prev,
            fullName: prev.fullName || me.name || "",
            phone: prev.phone || me.phone || ""
          }));
        }
      })
      .catch(() => {
        if (!mounted) return;
        setForm((prev) => ({
          ...prev,
          fullName: prev.fullName || user.name || "",
          phone: prev.phone || user.phone || ""
        }));
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.checkoutDraft,
      JSON.stringify({
        form,
        couponCode,
        selectedAddressId
      })
    );
  }, [couponCode, form, selectedAddressId]);

  const appliedDiscount = useMemo(() => 0, []);

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = addresses.find((item) => item._id === addressId);
    if (!address) return;

    setForm((prev) => ({
      ...prev,
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      pincode: address.pincode
    }));
  };

  const handlePay = async () => {
    if (!user) {
      toast({ title: "Please login to continue", variant: "destructive" });
      navigate("/login", { state: { from: { pathname: location.pathname } } });
      return;
    }

    if (!form.fullName || !form.phone || !form.address || !form.pincode) {
      toast({ title: "Please fill all delivery details", variant: "destructive" });
      return;
    }
    if (form.phone.length !== 10) {
      toast({ title: "Enter valid 10-digit phone number", variant: "destructive" });
      return;
    }

    if (!window.Razorpay) {
      toast({ title: "Razorpay not loaded", description: "Refresh and try again", variant: "destructive" });
      return;
    }

    setIsPaying(true);

    try {
      const checkout = await createCheckoutOrderApi({
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        deliveryType: form.deliveryType as "delivery" | "pickup",
        couponCode: couponCode.trim() || undefined,
        idempotencyKey: createIdempotencyKey(),
        deliveryDetails: {
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
          pincode: form.pincode
        }
      });

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error("Missing VITE_RAZORPAY_KEY_ID in frontend env");
      }

      const rzp = new window.Razorpay({
        key: razorpayKey,
        amount: checkout.amount,
        currency: checkout.currency,
        name: BRAND_NAME,
        description: "Order Payment",
        order_id: checkout.razorpayOrderId,
        prefill: {
          name: checkout.customer.name,
          email: checkout.customer.email,
          contact: checkout.customer.phone
        },
        theme: {
          color: "#2C8A52"
        },
        handler: async (response: any) => {
          try {
            const { verifyPaymentApi } = await import("@/lib/api");
            await verifyPaymentApi({
              orderId: checkout.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            clearCart();
            localStorage.removeItem(STORAGE_KEYS.checkoutDraft);
            await fetchOrders();
            toast({ title: "Order placed successfully", description: "Payment verified via Razorpay" });
            navigate("/orders");
          } catch (error) {
            toast({
              title: "Payment verification failed",
              description: error instanceof Error ? error.message : "Please contact support",
              variant: "destructive"
            });
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => setIsPaying(false)
        }
      });

      rzp.open();
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
      setIsPaying(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="container py-8 max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link to="/cart" className="hover:text-primary transition-colors">
          Cart
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Checkout</span>
      </div>

      <h1 className="text-3xl font-display text-foreground mb-8">Checkout</h1>

      <div className="grid md:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-6">
          {addresses.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border/50 p-6 space-y-3">
              <h3 className="font-display font-bold text-foreground">Saved Addresses</h3>
              <div className="space-y-2">
                {addresses.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleSelectAddress(item._id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedAddressId === item._id ? "border-primary bg-accent" : "border-border"
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground">{item.label} {item.isDefault ? "(Default)" : ""}</p>
                    <p className="text-xs text-muted-foreground">{item.fullName} · {item.phone}</p>
                    <p className="text-xs text-muted-foreground">{item.address} - {item.pincode}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
              Delivery Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { key: "fullName", label: "Full Name", type: "text", placeholder: "Karthick M" },
                { key: "phone", label: "Phone Number", type: "tel", placeholder: "+91" }
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [f.key]:
                          f.key === "phone"
                            ? e.target.value.replace(/\D/g, "").slice(0, 10)
                            : e.target.value
                      }))
                    }
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Address</label>
              <textarea
                placeholder="Enter full delivery address"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground h-20 resize-none"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pincode</label>
                <input
                  type="text"
                  placeholder="625001"
                  value={form.pincode}
                  onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Delivery Type</label>
                <div className="flex gap-3 mt-1">
                  {["delivery", "pickup"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((p) => ({ ...p, deliveryType: t }))}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        form.deliveryType === t
                          ? "border-primary bg-accent text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Coupon Code (Optional)</label>
              <input
                type="text"
                placeholder="SAVE50"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border/50 p-6">
            <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
              Payment Method
            </h3>
            <div className="space-y-2">
              {[
                { icon: Smartphone, label: "UPI (Google Pay, PhonePe)", active: true },
                { icon: CreditCard, label: "Credit / Debit Card", active: false },
                { icon: Building2, label: "Net Banking", active: false }
              ].map((m, i) => (
                <button
                  key={i}
                  className={`flex items-center gap-3 w-full p-3.5 rounded-xl border transition-all text-sm ${
                    m.active ? "border-primary bg-accent" : "border-border"
                  }`}
                >
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${m.active ? "border-primary" : "border-border"}`}>
                    {m.active && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <m.icon className={`h-4 w-4 ${m.active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={m.active ? "text-foreground font-medium" : "text-muted-foreground"}>{m.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Shield className="h-3 w-3" /> Powered by Razorpay · 100% secure
            </p>
          </motion.div>
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
            <h3 className="font-display font-bold text-foreground">Order Summary</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <img src={item.product.images[0]} alt="" loading="lazy" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t border-border pt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground">₹{totalAmount.toFixed(2)}</span>
              </div>
              {appliedDiscount > 0 ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span className="text-primary">-₹{appliedDiscount.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span className={deliveryCharge === 0 ? "text-primary font-medium" : "text-foreground"}>
                  {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                </span>
              </div>
            </div>
            <div className="flex justify-between font-bold text-xl border-t border-border pt-4 text-foreground">
              <span>Total</span>
              <span>₹{(totalAmount - appliedDiscount + deliveryCharge).toFixed(2)}</span>
            </div>
            <Button className="w-full h-12 rounded-xl font-semibold text-base shine" size="lg" onClick={handlePay} disabled={isPaying}>
              {isPaying ? "Processing..." : `Pay ₹${(totalAmount - appliedDiscount + deliveryCharge).toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
