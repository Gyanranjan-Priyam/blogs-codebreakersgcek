import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        profileImageKey: true,
        coverImageKey: true,
        createdAt: true,
        _count: {
          select: {
            tweets: {
              where: {
                isRetweet: false,
                replyToId: null,
              },
            },
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch user's tweets
    const tweets = await prisma.tweet.findMany({
      where: {
        userId: user.id,
        isRetweet: false,
        replyToId: null,
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    // Check if current user is following this profile
    let isFollowing = false;
    let isFollowingBack = false;
    if (session?.user) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;

      // Check if profile user follows current user back
      const followBack = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: session.user.id,
          },
        },
      });
      isFollowingBack = !!followBack;
    }

    return NextResponse.json({
      user,
      tweets,
      isFollowing,
      isFollowingBack,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
