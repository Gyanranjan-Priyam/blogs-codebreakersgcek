import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tweetId } = body;

    if (!tweetId) {
      return NextResponse.json(
        { error: "Tweet ID is required" },
        { status: 400 }
      );
    }

    // Check if tweet exists
    const tweet = await prisma.tweet.findUnique({
      where: { id: tweetId },
    });

    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_tweetId: {
          userId: session.user.id,
          tweetId: tweetId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      
      // Get updated like count
      const likeCount = await prisma.like.count({
        where: { tweetId },
      });

      // Emit socket event for real-time update
      try {
        const io = (global as any).io;
        if (io) {
          io.emit("likeTweet", { tweetId, likes: likeCount, userId: session.user.id });
        }
      } catch (error) {
        console.log("Socket emit failed:", error);
      }

      return NextResponse.json({ message: "Tweet unliked", liked: false });
    } else {
      // Like - use try/catch to handle race condition
      try {
        await prisma.like.create({
          data: {
            userId: session.user.id,
            tweetId: tweetId,
          },
        });

        // Get updated like count
        const likeCount = await prisma.like.count({
          where: { tweetId },
        });

        // Emit socket event for real-time update
        try {
          const io = (global as any).io;
          if (io) {
            io.emit("likeTweet", { tweetId, likes: likeCount, userId: session.user.id });
          }
        } catch (error) {
          console.log("Socket emit failed:", error);
        }

        return NextResponse.json({ message: "Tweet liked", liked: true });
      } catch (error: any) {
        // If unique constraint fails, the like already exists
        if (error.code === "P2002") {
          return NextResponse.json({ message: "Already liked", liked: true });
        }
        throw error;
      }
    }
  } catch (error) {
    console.error("Error liking/unliking tweet:", error);
    return NextResponse.json(
      { error: "Failed to like/unlike tweet" },
      { status: 500 }
    );
  }
}
