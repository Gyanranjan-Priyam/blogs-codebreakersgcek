import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username is too long").regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  bio: z.string().max(160, "Bio is too long").optional(),
  profileImageKey: z.string().optional(),
  coverImageKey: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, username, bio, profileImageKey, coverImageKey } = validation.data;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        username,
        bio: bio || null,
        image: profileImageKey ? `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${profileImageKey}` : undefined,
        profileImageKey: profileImageKey || undefined,
        coverImageKey: coverImageKey || undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        bio: updatedUser.bio,
        image: updatedUser.image,
        profileImageKey: updatedUser.profileImageKey,
        coverImageKey: updatedUser.coverImageKey,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
