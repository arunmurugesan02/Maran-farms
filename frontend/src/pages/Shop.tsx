import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/hooks/use-products";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePageMeta } from "@/hooks/use-page-meta";

const Shop = () => {
  usePageMeta("Shop | MARAN FARMS", "Browse grass and animal products from Maran Farms.");
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [category, setCategory] = useState(categoryParam || "all");
  const [type, setType] = useState("all");
  const [deliveryType, setDeliveryType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [showFilters, setShowFilters] = useState(false);

  const { minPrice, maxPrice } = useMemo(() => {
    if (priceRange === "0-100") return { minPrice: 0, maxPrice: 100 };
    if (priceRange === "100-500") return { minPrice: 100, maxPrice: 500 };
    if (priceRange === "500+") return { minPrice: 500, maxPrice: undefined };
    return { minPrice: undefined, maxPrice: undefined };
  }, [priceRange]);

  const resolvedCategory = useMemo(() => {
    if (category === "all") return undefined;
    if (category === "animals") return undefined;
    if (category === "grass") return "Grass";
    if (category === "napier") return "Napier";
    return category;
  }, [category]);

  const resolvedType = category === "animals" ? "animal" : type === "all" ? undefined : type;

  const { data: products = [], isLoading } = useProducts({
    category: resolvedCategory,
    type: resolvedType,
    deliveryType: deliveryType === "all" ? undefined : deliveryType,
    search: debouncedSearch || undefined,
    minPrice,
    maxPrice
  });

  const activeFilters =
    (category !== "all" ? 1 : 0) +
    (type !== "all" ? 1 : 0) +
    (deliveryType !== "all" ? 1 : 0) +
    (priceRange !== "all" ? 1 : 0) +
    (search ? 1 : 0);

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Search</h3>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name"
          className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background"
        />
      </div>

      <div>
        <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Category</h3>
        <div className="space-y-1">
          {[
            { val: "all", label: "All Products" },
            { val: "napier", label: "Napier" },
            { val: "grass", label: "Grass" },
            { val: "animals", label: "Animals" }
          ].map((c) => (
            <button
              key={c.val}
              onClick={() => setCategory(c.val)}
              className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                category === c.val
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Type</h3>
        <div className="space-y-1">
          {["all", "grass", "animal"].map((item) => (
            <button
              key={item}
              onClick={() => setType(item)}
              className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                type === item
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item === "all" ? "All" : item}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Delivery Type</h3>
        <div className="space-y-1">
          {["all", "delivery", "pickup"].map((item) => (
            <button
              key={item}
              onClick={() => setDeliveryType(item)}
              className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                deliveryType === item
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item === "all" ? "All" : item}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Price Range</h3>
        <div className="space-y-1">
          {[
            { value: "all", label: "All" },
            { value: "0-100", label: "₹0 - ₹100" },
            { value: "100-500", label: "₹100 - ₹500" },
            { value: "500+", label: "₹500+" }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setPriceRange(item.value)}
              className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                priceRange === item.value
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {activeFilters > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-xl"
          onClick={() => {
            setCategory("all");
            setType("all");
            setDeliveryType("all");
            setPriceRange("all");
            setSearch("");
          }}
        >
          Clear Filters ({activeFilters})
        </Button>
      )}
    </div>
  );

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span className="text-border">›</span>
        <span className="text-foreground font-medium">Shop</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display text-foreground mb-1">Shop Products</h1>
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
          </Button>
          <p className="text-sm text-muted-foreground">{products.length} products</p>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
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

      <div className="grid md:grid-cols-[240px_1fr] gap-8">
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((item, index) => (
                <ProductCard key={item.id} product={item} index={index} />
              ))}
            </div>
          )}
          {!isLoading && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg font-display text-foreground mb-2">No products found</p>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting filters or search term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
