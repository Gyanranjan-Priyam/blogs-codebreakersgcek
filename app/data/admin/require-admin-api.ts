import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Server-side helper to require admin authentication in API routes
 * @throws Error with message "Unauthorized" if user is not authenticated or not an admin
 * @returns The authenticated admin session
 */
export async function requireAdminAPI() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check if user has admin role
  if ((session.user as any).role !== "admin") {
    throw new Error("Unauthorized");
  }

  return session;
}
