import { useQuery } from "@tanstack/react-query";
import { getProductsApi } from "@/lib/api";

export function useProducts(filters?: {
  category?: string;
  type?: string;
  search?: string;
  deliveryType?: string;
  minPrice?: number;
  maxPrice?: number;
  lowStockOnly?: boolean;
}) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => getProductsApi(filters),
    staleTime: 30_000
  });
}
