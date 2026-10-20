import { Suspense } from "react";
import { CustomerAccountClient } from "./CustomerAccountClient";

export const metadata = {
  title: "My Account & Customer Settings | Pink Farm",
  description: "Manage your Pink Farm customer profile, saved delivery addresses, order history, farm credits, and delivery preferences.",
};

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto w-full max-w-6xl px-4 py-12" aria-live="polite">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-brand-green/10" />
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-white shadow-sm" />
      </div>
    }>
      <CustomerAccountClient />
    </Suspense>
  );
}
