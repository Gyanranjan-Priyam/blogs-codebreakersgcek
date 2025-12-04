import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getRedirectPath() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return "/login";
    }

    // If user is admin, redirect to admin dashboard
    if ((session.user as any).role === "admin") {
        return "/admin";
    }

    // Otherwise, redirect to user dashboard
    return "/dashboard";
}