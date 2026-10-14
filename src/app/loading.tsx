import { MakhanaLoader } from "@/components/ui/MakhanaLoader";

export default function Loading() {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-6">
      <MakhanaLoader
        size="xl"
        text="Loading Freshness..."
        subtext="Every bite crafted with love"
      />
    </div>
  );
}
