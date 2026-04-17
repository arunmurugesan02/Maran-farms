import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getWishlistApi } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const Wishlist = () => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlistApi
  });

  if (isLoading) {
    return <div className="container py-12 text-muted-foreground">Loading wishlist...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container py-12">
        <h1 className="text-2xl font-display text-foreground">Wishlist</h1>
        <p className="text-sm text-muted-foreground mt-2">Your wishlist is empty. Add products from product page.</p>
        <Link to="/shop" className="text-primary text-sm mt-4 inline-block">Go to shop</Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-display text-foreground mb-6">My Wishlist</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
