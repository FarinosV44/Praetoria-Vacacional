import { Skeleton } from "@/components/ui/Skeleton";

export default function PropertyLoading() {
  return (
    <div className="container-page py-8">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-10 w-3/4 max-w-xl" />
      <Skeleton className="mt-3 h-5 w-2/3 max-w-lg" />
      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <Skeleton className="aspect-[4/3] rounded-xl sm:col-span-2 lg:row-span-2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
        ))}
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[28rem] w-full rounded-xl" />
      </div>
    </div>
  );
}
