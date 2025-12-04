import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userIds } = await req.json();

    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Filter out any null/undefined values
    const validUserIds = userIds.filter(id => id != null);

    if (validUserIds.length === 0) {
      return NextResponse.json({ followingIds: [] });
    }

    // Find all users that the current user is following from the provided list
    const followingRecords = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: {
          in: validUserIds,
        },
      },
      select: {
        followingId: true,
      },
    });

    // Extract the IDs of users being followed
    const followingIds = followingRecords.map(record => record.followingId);

    return NextResponse.json({ followingIds });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { error: "Failed to check follow status" },
      { status: 500 }
    );
  }
}
