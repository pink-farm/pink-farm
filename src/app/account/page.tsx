import { CustomerAccountClient } from "./CustomerAccountClient";

export const metadata = {
  title: "My Account & Customer Settings | Pink Farm",
  description: "Manage your Pink Farm customer profile, saved delivery addresses, order history, farm credits, and delivery preferences.",
};

export default function AccountPage() {
  return <CustomerAccountClient />;
}
