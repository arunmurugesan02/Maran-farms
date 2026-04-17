import { useQuery } from "@tanstack/react-query";
import { getProductsApi } from "@/lib/api";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: getProductsApi
  });
}
