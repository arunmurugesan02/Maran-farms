import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X, ShoppingBag, Shield, ArrowLeft, Truck, TicketPercent } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { validateCouponApi } from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

function getItemSavings(item: { product: any; quantity: number }) {
  const tiers = [...(item.product.bulkPricingTiers || [])].sort((a, b) => a.minQty - b.minQty);
  const tier = tiers.filter((entry) => item.quantity >= entry.minQty).at(-1);
  if (!tier) return 0;

  const unitPrice = item.product.price;
  const discountPerUnit = tier.discountType === "flat" ? tier.discountValue : (unitPrice * tier.discountValue) / 100;
  const effective = Math.max(0, unitPrice - discountPerUnit);
  return (unitPrice - effective) * item.quantity;
}

const Cart = () => {
  const { items, removeFromCart, updateQuantity, totalAmount } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState<any | null>(null);
  const { toast } = useToast();

  const baseSavings = items.reduce((sum, item) => sum + getItemSavings(item), 0);
  const deliveryCharge = totalAmount > 500 ? 0 : totalAmount > 0 ? 40 : 0;

  const couponMutation = useMutation({
    mutationFn: () => validateCouponApi({ couponCode: couponCode.trim().toUpperCase() }),
    onSuccess: (data) => {
      setCouponInfo(data);
      toast({ title: `Coupon ${data.code} applied` });
    },
    onError: (error) => {
      setCouponInfo(null);
      toast({
        title: "Coupon invalid",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  });

  const couponDiscount = (() => {
    if (!couponInfo) return 0;
    if (totalAmount < (couponInfo.minCartAmount || 0)) return 0;

    let amount = couponInfo.type === "flat" ? couponInfo.value : (totalAmount * couponInfo.value) / 100;
    if (couponInfo.maxDiscount > 0) {
      amount = Math.min(amount, couponInfo.maxDiscount);
    }
    return Math.min(amount, totalAmount);
  })();

  const totalSavings = baseSavings + couponDiscount;

  if (items.length === 0) {
    return (
      <div className="container py-24 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-display text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/shop">
            <Button className="rounded-xl h-11 px-8">Start Shopping</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display text-foreground">Shopping Cart</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {items.length} item{items.length > 1 ? "s" : ""} in your cart
          </p>
        </div>
        <Link to="/shop" className="text-sm text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Continue Shopping
        </Link>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item.product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50"
            >
              <img src={item.product.images[0]} alt={item.product.name} loading="lazy" className="w-20 h-20 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <Link to={`/product/${item.product.id}`} className="font-display font-semibold text-foreground text-sm hover:text-primary transition-colors">
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ₹{item.product.price} / {item.product.unit} · <span className="capitalize">{item.product.deliveryType}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - (item.product.type === "grass" ? 10 : 1))}
                      className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-semibold w-10 text-center text-foreground">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + (item.product.type === "grass" ? 10 : 1))}
                      className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="font-bold text-foreground">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-foreground">Order Summary</h3>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Apply Coupon</label>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon"
                  className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => couponMutation.mutate()}
                  disabled={!couponCode.trim() || couponMutation.isPending}
                >
                  {couponMutation.isPending ? "..." : "Apply"}
                </Button>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground font-medium">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Bulk + Offer Savings</span>
                <span className="text-primary font-medium">-₹{totalSavings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span className={deliveryCharge === 0 ? "text-primary font-medium" : "text-foreground font-medium"}>
                  {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge.toFixed(2)}`}
                </span>
              </div>
              {totalSavings > 0 ? (
                <div className="bg-accent/50 rounded-xl px-3 py-2 text-xs text-primary inline-flex items-center gap-1">
                  <TicketPercent className="h-3.5 w-3.5" /> You saved ₹{totalSavings.toFixed(2)}
                </div>
              ) : null}
            </div>
            <div className="flex justify-between font-bold text-xl border-t border-border pt-4 text-foreground">
              <span>Total</span>
              <span>₹{(totalAmount - totalSavings + deliveryCharge).toFixed(2)}</span>
            </div>
            <Link to="/checkout" className="block">
              <Button className="w-full h-12 rounded-xl font-semibold text-base shine" size="lg">
                Proceed to Checkout
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 justify-center">
              <Shield className="h-3.5 w-3.5" /> Secure checkout · 100% safe payments
            </p>
            {totalAmount > 0 && totalAmount < 500 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 justify-center">
                <Truck className="h-3.5 w-3.5 text-primary" /> Add ₹{(500 - totalAmount).toFixed(2)} more for FREE delivery
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
