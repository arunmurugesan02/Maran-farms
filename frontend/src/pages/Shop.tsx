import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Grid3X3, LayoutGrid, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '@/hooks/use-products';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';

const Shop = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [category, setCategory] = useState(categoryParam || 'all');
  const [priceRange, setPriceRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [gridCols, setGridCols] = useState(3);
  const { data: products = [], isLoading } = useProducts();

  const filtered = products.filter(p => {
    if (category !== 'all') {
      if (category === 'napier' && p.category !== 'Napier') return false;
      if (category === 'grass' && !['Grass', 'Plants'].includes(p.category)) return false;
      if (category === 'plants' && p.category !== 'Plants') return false;
      if (category === 'birds' && p.category !== 'Birds') return false;
      if (category === 'pets' && p.category !== 'Pets') return false;
      if (category === 'animals' && p.type !== 'animal') return false;
    }
    if (priceRange === '0-5' && p.price > 5) return false;
    if (priceRange === '5-100' && (p.price < 5 || p.price > 100)) return false;
    if (priceRange === '100-500' && (p.price < 100 || p.price > 500)) return false;
    if (priceRange === '500+' && p.price < 500) return false;
    return true;
  });

  const activeFilters = (category !== 'all' ? 1 : 0) + (priceRange !== 'all' ? 1 : 0);

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Category</h3>
        <div className="space-y-1">
          {[
            { val: 'all', label: 'All Products', emoji: '🛒' },
            { val: 'napier', label: 'Napier Grass', emoji: '🌾' },
            { val: 'grass', label: 'Other Grass & Plants', emoji: '🌿' },
            { val: 'animals', label: 'Birds & Pets', emoji: '🐾' },
          ].map(c => (
            <button
              key={c.val}
              onClick={() => setCategory(c.val)}
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm transition-all ${
                category === c.val
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Price Range</h3>
        <div className="space-y-1">
          {[
            { value: 'all', label: 'All Prices' },
            { value: '0-5', label: 'Under ₹5' },
            { value: '5-100', label: '₹5 – ₹100' },
            { value: '100-500', label: '₹100 – ₹500' },
            { value: '500+', label: '₹500+' },
          ].map(r => (
            <button
              key={r.value}
              onClick={() => setPriceRange(r.value)}
              className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                priceRange === r.value
                  ? 'bg-accent text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {activeFilters > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-xl"
          onClick={() => { setCategory('all'); setPriceRange('all'); }}
        >
          Clear Filters ({activeFilters})
        </Button>
      )}
    </div>
  );

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="text-border">›</span>
        <span className="text-foreground font-medium">Shop</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display text-foreground mb-1">
            {category === 'napier' ? '🌾 Napier Grass' : category === 'grass' ? '🌿 Grass & Plants' : category === 'animals' ? '🐾 Birds & Pets' : 'All Products'}
          </h1>
          <p className="text-muted-foreground">Fresh from our farm to your home</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="md:hidden rounded-xl gap-1.5"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilters > 0 && (
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">{filtered.length} products</p>
        </div>
      </div>

      {/* Mobile filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mb-6 overflow-hidden"
          >
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-semibold text-foreground">Filters</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <FilterPanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-[220px_1fr] gap-8">
        {/* Desktop Filters */}
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        {/* Products */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-lg font-display text-foreground mb-2">No products found</p>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters</p>
              <Button variant="outline" onClick={() => { setCategory('all'); setPriceRange('all'); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
