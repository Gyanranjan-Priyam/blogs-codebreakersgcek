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
    const { tweetId, content } = body;

    if (!tweetId) {
      return NextResponse.json(
        { error: "Tweet ID is required" },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
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

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        tweetId: tweetId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    // Emit socket event for real-time update
    try {
      const io = (global as any).io;
      if (io) {
        io.emit("newComment", { tweetId, comment });
      }
    } catch (error) {
      console.log("Socket emit failed:", error);
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        tweet: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Allow deletion if user is comment author OR tweet author
    if (comment.userId !== session.user.id && comment.tweet.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tweetId = comment.tweetId;

    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Emit socket event for real-time update
    try {
      const io = (global as any).io;
      if (io) {
        io.emit("deleteComment", { tweetId, commentId });
      }
    } catch (error) {
      console.log("Socket emit failed:", error);
    }

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}