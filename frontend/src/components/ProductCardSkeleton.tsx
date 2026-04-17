import { Skeleton } from "@/components/ui/skeleton";

const ProductCardSkeleton = () => (
  <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
    <Skeleton className="aspect-[4/3] rounded-none" />
    <div className="p-4 space-y-3">
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
    </div>
  </div>
);

export default ProductCardSkeleton;
