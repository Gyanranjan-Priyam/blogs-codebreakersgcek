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
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId: commentId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.commentLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      // Get updated like count
      const likeCount = await prisma.commentLike.count({
        where: { commentId },
      });

      // Emit socket event for real-time update
      try {
        const io = (global as any).io;
        if (io) {
          io.emit("likeComment", { tweetId: comment.tweetId, commentId, likes: likeCount });
        }
      } catch (error) {
        console.log("Socket emit failed:", error);
      }

      return NextResponse.json({ message: "Comment unliked", liked: false });
    } else {
      // Like
      try {
        await prisma.commentLike.create({
          data: {
            userId: session.user.id,
            commentId: commentId,
          },
        });

        // Get updated like count
        const likeCount = await prisma.commentLike.count({
          where: { commentId },
        });

        // Emit socket event for real-time update
        try {
          const io = (global as any).io;
          if (io) {
            io.emit("likeComment", { tweetId: comment.tweetId, commentId, likes: likeCount });
          }
        } catch (error) {
          console.log("Socket emit failed:", error);
        }

        return NextResponse.json({ message: "Comment liked", liked: true });
      } catch (error: any) {
        if (error.code === "P2002") {
          return NextResponse.json({ message: "Already liked", liked: true });
        }
        throw error;
      }
    }
  } catch (error) {
    console.error("Error liking comment:", error);
    return NextResponse.json(
      { error: "Failed to like comment" },
      { status: 500 }
    );
  }
}
