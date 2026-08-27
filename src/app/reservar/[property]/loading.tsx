import { Skeleton } from "@/components/ui/Skeleton";

export default function CheckoutLoading() {
  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
