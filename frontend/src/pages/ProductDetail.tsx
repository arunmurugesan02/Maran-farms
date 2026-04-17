import { useParams, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  Shield,
  Award,
  Headphones,
  Heart,
  ChevronRight,
  ZoomIn,
  MessageCircle,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import ImageLightbox from "@/components/ImageLightbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addWishlistApi,
  getProductByIdApi,
  getProductReviewsApi,
  getProductsApi,
  getWishlistApi,
  removeWishlistApi,
  submitProductReviewApi
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/use-page-meta";

const ProductDetail = () => {
  usePageMeta("Product | MARAN FARMS", "Product details, reviews, and ordering for Maran Farms products.");
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductByIdApi(id || ""),
    enabled: Boolean(id)
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProductsApi()
  });

  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ["product-reviews", id],
    queryFn: () => getProductReviewsApi(id || ""),
    enabled: Boolean(id)
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlistApi,
    enabled: Boolean(user)
  });

  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const isWishlisted = useMemo(
    () => Boolean(product && wishlist.some((item) => item.id === product.id)),
    [wishlist, product]
  );

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      if (!product) return;
      if (isWishlisted) {
        await removeWishlistApi(product.id);
      } else {
        await addWishlistApi(product.id);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast({ title: isWishlisted ? "Removed from wishlist" : "Added to wishlist" });
    },
    onError: (error) => {
      toast({
        title: "Wishlist action failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  });

  const reviewMutation = useMutation({
    mutationFn: () => submitProductReviewApi(id || "", { rating, comment }),
    onSuccess: async () => {
      setComment("");
      await refetchReviews();
      await queryClient.invalidateQueries({ queryKey: ["product", id] });
      toast({ title: "Review submitted" });
    },
    onError: (error) => {
      toast({
        title: "Review failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (!product) return;
    setQuantity(product.type === "grass" ? product.minQty : 1);
  }, [product]);

  if (isLoading)
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );

  if (isError || !product)
    return (
      <div className="container py-20 text-center">
        <p className="text-6xl mb-4">🤷</p>
        <h2 className="text-2xl font-display text-foreground mb-2">Product not found</h2>
        <Link to="/shop">
          <Button className="mt-4">Back to Shop</Button>
        </Link>
      </div>
    );

  const total = product.price * quantity;
  const relatedProducts = allProducts
    .filter((p) => p.type === product.type && p.id !== product.id)
    .slice(0, 3);

  const whatsappText = encodeURIComponent(`I want to buy ${product.name}`);
  const whatsappHref = `https://wa.me/919600267271?text=${whatsappText}`;

  return (
    <div className="container py-8 pb-24 md:pb-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link to="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/shop" className="hover:text-primary transition-colors">
          Shop
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div
            className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border/50 relative group cursor-zoom-in"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm h-12 w-12 rounded-full flex items-center justify-center">
                <ZoomIn className="h-5 w-5 text-foreground" />
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!user) {
                    toast({ title: "Please login to use wishlist", variant: "destructive" });
                    return;
                  }
                  wishlistMutation.mutate();
                }}
                className="h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current text-primary" : "text-muted-foreground"}`} />
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  i === selectedImage
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">{product.category}</span>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  product.stock > 0 ? "bg-accent text-primary" : "bg-destructive/10 text-destructive"
                }`}
              >
                {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
              </span>
              {product.averageRating ? (
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {product.averageRating.toFixed(1)} ({product.ratingsCount || 0})
                </span>
              ) : null}
            </div>
            <h1 className="text-3xl md:text-4xl font-display text-foreground mb-3">{product.name}</h1>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">₹{product.price}</span>
              <span className="text-muted-foreground text-sm">per {product.unit}</span>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="bg-muted/30 rounded-2xl p-5 border border-border/50">
            <label className="text-sm font-semibold text-foreground mb-3 block">Select Quantity</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border rounded-xl overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  onClick={() =>
                    setQuantity((q) => Math.max(product.type === "grass" ? product.minQty : 1, q - (product.type === "grass" ? 10 : 1)))
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(product.type === "grass" ? product.minQty : 1, Number(e.target.value))
                    )
                  }
                  className="w-20 text-center py-2 text-foreground bg-transparent font-semibold focus:outline-none"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  onClick={() => setQuantity((q) => q + (product.type === "grass" ? 10 : 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-right flex-1">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-primary">₹{total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              className="h-12 rounded-xl font-semibold text-base"
              size="lg"
              onClick={() => addToCart(product, quantity)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
            </Button>
            <Button variant="outline" size="lg" className="h-12 rounded-xl font-semibold text-base" asChild>
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
              </a>
            </Button>
            <Button variant="outline" size="lg" className="h-12 rounded-xl font-semibold text-base" asChild>
              <Link to="/cart">Buy Now</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-border/50">
            {[
              { icon: Truck, label: "Delivery", sub: "2-4 Days" },
              { icon: Shield, label: "Secure", sub: "100% Safe" },
              { icon: Award, label: "Quality", sub: "Premium" },
              { icon: Headphones, label: "Support", sub: "24/7" }
            ].map((t, i) => (
              <div key={i} className="text-center p-2">
                <t.icon className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xs font-medium text-foreground">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{t.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <section className="mt-14 bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="text-xl font-display text-foreground">Reviews & Ratings</h2>
        {reviews.length === 0 ? <p className="text-sm text-muted-foreground">No reviews yet.</p> : null}
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review._id} className="border border-border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm text-foreground">{review.user?.name || "Verified buyer"}</p>
                <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              <p className="text-xs text-primary mt-1">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
              {review.comment ? <p className="text-sm text-muted-foreground mt-2">{review.comment}</p> : null}
            </div>
          ))}
        </div>

        {user ? (
          <div className="border-t border-border pt-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground">Write a Review</h3>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="border border-border rounded-xl px-3 py-2 bg-background"
            >
              {[5, 4, 3, 2, 1].map((item) => (
                <option key={item} value={item}>
                  {item} Star
                </option>
              ))}
            </select>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="border border-border rounded-xl px-3 py-2 bg-background w-full"
              placeholder="Share your experience"
            />
            <Button onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Login to submit a review.</p>
        )}
      </section>

      {relatedProducts.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl font-display text-foreground mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {relatedProducts.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/product/${p.id}`}
                  className="group block bg-card rounded-2xl border border-border/50 overflow-hidden hover-lift"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-foreground text-sm">{p.name}</h3>
                    <p className="text-primary font-bold mt-1">
                      ₹{p.price} <span className="text-xs text-muted-foreground font-normal">/{p.unit}</span>
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <ImageLightbox
        images={product.images}
        currentIndex={selectedImage}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setSelectedImage}
      />
    </div>
  );
};

export default ProductDetail;
