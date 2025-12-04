import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function generateUsernames() {
    console.log("🔍 Finding users without usernames...");
    
    const usersWithoutUsername = await prisma.user.findMany({
        where: {
            OR: [
                { username: null },
                { username: "" }
            ]
        },
        select: {
            id: true,
            email: true,
            name: true,
        }
    });

    console.log(`📊 Found ${usersWithoutUsername.length} users without usernames`);

    for (const user of usersWithoutUsername) {
        try {
            // Try to get username from GitHub account
            const githubAccount = await prisma.account.findFirst({
                where: {
                    userId: user.id,
                    providerId: "github",
                },
                select: {
                    accessToken: true,
                },
            });

            let generatedUsername = null;

            // Try to fetch GitHub username
            if (githubAccount?.accessToken) {
                try {
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
                            console.log(`✅ Found GitHub username: ${githubUser.login} for ${user.email}`);
                        }
                    }
                } catch (error) {
                    console.log(`⚠️  Failed to fetch GitHub username for ${user.email}`);
                }
            }

            // If no GitHub username, generate from email
            if (!generatedUsername) {
                const baseName = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
                const randomSuffix = Math.floor(Math.random() * 10000);
                generatedUsername = `${baseName}${randomSuffix}`;
                console.log(`🎲 Generated username from email: ${generatedUsername} for ${user.email}`);
            }

            // Ensure username is unique
            let finalUsername = generatedUsername;
            let counter = 1;
            while (true) {
                const existing = await prisma.user.findUnique({
                    where: { username: finalUsername },
                });
                if (!existing || existing.id === user.id) break;
                finalUsername = `${generatedUsername}${counter}`;
                counter++;
                console.log(`⚠️  Username ${generatedUsername} taken, trying ${finalUsername}`);
            }

            // Update user
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    username: finalUsername,
                    updatedAt: new Date(),
                },
            });

            console.log(`✅ Set username @${finalUsername} for ${user.name} (${user.email})`);
        } catch (error) {
            console.error(`❌ Error generating username for ${user.email}:`, error);
        }
    }

    console.log("\n✨ Username generation complete!");
}

generateUsernames()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
