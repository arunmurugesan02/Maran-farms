import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Eye, Truck, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductCard = ({ product, index = 0 }: { product: Product; index?: number }) => {
  const { addToCart } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group bg-card rounded-2xl border border-border/60 overflow-hidden hover-lift"
    >
      <Link to={`/product/${product.id}`} className="block relative">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-card/90 backdrop-blur-sm rounded-full p-3">
              <Eye className="h-5 w-5 text-foreground" />
            </div>
          </div>
        </div>
        {/* Badge */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-sm text-foreground">
            {product.category === 'Napier' ? '🌾 Napier' : product.category === 'Grass' ? '🌿 Grass' : product.category === 'Plants' ? '🌱 Plant' : product.category === 'Birds' ? '🐦 Bird' : '🐾 Pet'}
          </span>
        </div>
        {product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground">
              Low Stock
            </span>
          </div>
        )}
      </Link>

      <div className="p-4 space-y-3">
        <div>
          <Link to={`/product/${product.id}`}>
            <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors text-base leading-tight">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1.5 mt-1">
            {product.deliveryType === 'delivery' ? (
              <Truck className="h-3 w-3 text-muted-foreground" />
            ) : (
              <MapPin className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground capitalize">{product.deliveryType}</span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-xl font-bold text-primary">₹{product.price}</span>
            <span className="text-xs text-muted-foreground ml-1">/{product.unit}</span>
            {product.type === 'grass' && (
              <p className="text-[10px] text-muted-foreground mt-0.5">Min. {product.minQty} pcs</p>
            )}
          </div>
          <Button
            size="sm"
            className="h-9 w-9 p-0 rounded-xl"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product, product.type === 'grass' ? product.minQty : 1);
            }}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
