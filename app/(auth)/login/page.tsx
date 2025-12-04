import { auth } from "@/lib/auth";
import { LoginForm } from "./_components/LoginForm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default async function LoginPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if(session) {
        // If user is logged in, redirect to home
        return redirect("/");
    }
    return (
        <LoginForm />
    )
}