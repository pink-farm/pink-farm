export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 pt-12 md:pt-16 pb-16 animate-pulse">
      <div className="text-center mb-10 space-y-3">
        <div className="h-10 w-56 bg-brand-cream rounded-xl mx-auto" />
        <div className="h-5 w-72 bg-brand-cream rounded mx-auto" />
      </div>
      <div className="h-14 w-full bg-brand-cream rounded-xl mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white border border-brand-pink-accent/20 p-3 space-y-3">
            <div className="aspect-square rounded-xl bg-brand-cream" />
            <div className="h-5 w-3/4 bg-brand-cream rounded" />
            <div className="h-4 w-1/2 bg-brand-cream rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

