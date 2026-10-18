import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign In | Pink Farm",
};

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-brand-cream px-4 py-8 pb-28 sm:pb-16 min-w-0">
      <div className="bg-white p-5 sm:p-8 md:p-10 rounded-3xl shadow-soft w-full max-w-md border border-brand-green-light/10 min-w-0">
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-green font-bold">Your Pink Farm Account</h1>
          <p className="text-brand-charcoal opacity-70 mt-2 text-sm">Sign in or create a customer account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
