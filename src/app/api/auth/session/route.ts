import { NextResponse } from "next/server";
import { requireAdminSession, getCustomerSession } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdminSession();
  const customer = await getCustomerSession();

  return NextResponse.json({
    isAdmin: Boolean(admin),
    isCustomer: Boolean(customer),
  });
}
