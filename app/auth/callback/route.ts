import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return redirect("/login");
    }

    // Auto-generate and save username for new users
    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { username: true },
        });

        if (!user?.username) {
            // Try to get username from OAuth provider
            const githubAccount = await prisma.account.findFirst({
                where: {
                    userId: session.user.id,
                    providerId: "github",
                },
                select: {
                    accessToken: true,
                },
            });

            const googleAccount = await prisma.account.findFirst({
                where: {
                    userId: session.user.id,
                    providerId: "google",
                },
            });

            const discordAccount = await prisma.account.findFirst({
                where: {
                    userId: session.user.id,
                    providerId: "discord",
                },
            });

            let generatedUsername = null;

            // Try to fetch GitHub username
            if (githubAccount?.accessToken) {
                const githubResponse = await fetch("https://api.github.com/user", {
                    headers: {
                        Authorization: `Bearer ${githubAccount.accessToken}`,
                        Accept: "application/json",
                    },
                });

                if (githubResponse.ok) {
                    const githubUser = await githubResponse.json();
                    if (githubUser.login) {
                        generatedUsername = githubUser.login;
                    }
                }
            }

            // If no GitHub username, generate from email or name
            if (!generatedUsername) {
                const baseName = session.user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
                const randomSuffix = Math.floor(Math.random() * 10000);
                generatedUsername = `${baseName}${randomSuffix}`;
            }

            // Ensure username is unique
            let finalUsername = generatedUsername;
            let counter = 1;
            while (true) {
                const existing = await prisma.user.findUnique({
                    where: { username: finalUsername },
                });
                if (!existing) break;
                finalUsername = `${generatedUsername}${counter}`;
                counter++;
            }

            const updatedUser = await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    username: finalUsername,
                    updatedAt: new Date(),
                },
            });
            
            console.log(`✅ Auto-generated username: @${finalUsername} for user ${session.user.id}`);
        } else {
            console.log(`✅ User already has username: @${user.username}`);
        }
    } catch (error) {
        console.error("Error auto-generating username:", error);
        // Don't fail the redirect if this fails
    }

    // For Twitter clone, just redirect to home
    return redirect("/");
}