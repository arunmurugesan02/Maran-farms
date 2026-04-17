import { useParams, Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingCart, Truck, Shield, Award, Headphones, Heart, Share2, ChevronRight, ZoomIn } from 'lucide-react';
import { motion } from 'framer-motion';
import ImageLightbox from '@/components/ImageLightbox';
import { useQuery } from '@tanstack/react-query';
import { getProductByIdApi, getProductsApi } from '@/lib/api';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductByIdApi(id || ''),
    enabled: Boolean(id),
  });
  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: getProductsApi,
  });
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product) return;
    setQuantity(product.type === 'grass' ? product.minQty : 1);
  }, [product]);

  if (isLoading) return (
    <div className="container py-20 text-center">
      <p className="text-muted-foreground">Loading product...</p>
    </div>
  );

  if (isError || !product) return (
    <div className="container py-20 text-center">
      <p className="text-6xl mb-4">🤷</p>
      <h2 className="text-2xl font-display text-foreground mb-2">Product not found</h2>
      <Link to="/shop"><Button className="mt-4">Back to Shop</Button></Link>
    </div>
  );

  const total = product.price * quantity;
  const relatedProducts = allProducts.filter(p => p.type === product.type && p.id !== product.id).slice(0, 3);

  return (
    <div className="container py-8 pb-24 md:pb-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
        {/* Images */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div
            className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border/50 relative group cursor-zoom-in"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm h-12 w-12 rounded-full flex items-center justify-center">
                <ZoomIn className="h-5 w-5 text-foreground" />
              </div>
            </div>
            <div className="absolute top-4 left-4">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm text-foreground">
                {product.type === 'grass' ? '🌿 Grass' : '🐾 Animal'}
              </span>
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={(e) => e.stopPropagation()} className="h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
                <Heart className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={(e) => e.stopPropagation()} className="h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  i === selectedImage ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Details */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">{product.category}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                product.stock > 0 ? 'bg-accent text-primary' : 'bg-destructive/10 text-destructive'
              }`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display text-foreground mb-3">{product.name}</h1>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">₹{product.price}</span>
              <span className="text-muted-foreground text-sm">per {product.unit}</span>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          {/* Product specs */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Category', value: product.category },
              { label: 'Delivery', value: product.deliveryType },
              ...(product.type === 'grass' ? [{ label: 'Min Order', value: `${product.minQty} pieces` }] : []),
              ...(product.age ? [{ label: 'Age', value: product.age }] : []),
              ...(product.health ? [{ label: 'Health', value: product.health }] : []),
            ].map((spec, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded-xl text-sm">
                <span className="text-muted-foreground">{spec.label}</span>
                <span className="font-medium text-foreground capitalize">{spec.value}</span>
              </div>
            ))}
          </div>

          {/* Quantity */}
          <div className="bg-muted/30 rounded-2xl p-5 border border-border/50">
            <label className="text-sm font-semibold text-foreground mb-3 block">Select Quantity</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border rounded-xl overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  onClick={() => setQuantity(q => Math.max(product.type === 'grass' ? product.minQty : 1, q - (product.type === 'grass' ? 10 : 1)))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(product.type === 'grass' ? product.minQty : 1, Number(e.target.value)))}
                  className="w-20 text-center py-2 text-foreground bg-transparent font-semibold focus:outline-none"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  onClick={() => setQuantity(q => q + (product.type === 'grass' ? 10 : 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-right flex-1">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-primary">₹{total.toFixed(2)}</p>
              </div>
            </div>
            {product.type === 'grass' && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                ⚠️ Minimum {product.minQty} pieces required for grass orders
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="flex-1 h-12 rounded-xl font-semibold text-base shine" size="lg" onClick={() => addToCart(product, quantity)}>
              <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
            </Button>
            <Button variant="outline" size="lg" className="flex-1 h-12 rounded-xl font-semibold text-base" asChild>
              <Link to="/cart">Buy Now</Link>
            </Button>
          </div>

          {/* Trust */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-border/50">
            {[
              { icon: Truck, label: 'Delivery', sub: '2-4 Days' },
              { icon: Shield, label: 'Secure', sub: '100% Safe' },
              { icon: Award, label: 'Quality', sub: 'Premium' },
              { icon: Headphones, label: 'Support', sub: '24/7' },
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

      {/* Related */}
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
                <Link to={`/product/${p.id}`} className="group block bg-card rounded-2xl border border-border/50 overflow-hidden hover-lift">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-foreground text-sm">{p.name}</h3>
                    <p className="text-primary font-bold mt-1">₹{p.price} <span className="text-xs text-muted-foreground font-normal">/{p.unit}</span></p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky add-to-cart bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border p-3 flex items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-lg font-bold text-primary leading-tight">₹{total.toFixed(2)}</p>
        </div>
        <Button
          onClick={() => addToCart(product, quantity)}
          className="h-11 rounded-xl px-5 font-semibold flex-1"
        >
          <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
        </Button>
      </div>

      {/* Lightbox */}
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
