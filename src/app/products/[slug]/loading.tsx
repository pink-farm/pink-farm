export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-6 pb-28 sm:pb-16 min-w-0 animate-pulse">
      <div className="h-4 w-48 bg-brand-cream rounded mb-4" />
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-[46%] xl:w-[44%] aspect-square rounded-2xl bg-brand-cream" />
        <div className="flex-1 space-y-4 w-full">
          <div className="h-5 w-36 bg-brand-cream rounded" />
          <div className="h-9 w-3/4 bg-brand-cream rounded" />
          <div className="h-4 w-1/2 bg-brand-cream rounded" />
          <div className="h-32 w-full bg-brand-cream rounded-xl" />
        </div>
      </div>
    </div>
  );
}

