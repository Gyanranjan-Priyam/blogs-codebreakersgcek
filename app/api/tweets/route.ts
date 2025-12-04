import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { S3 } from "@/lib/s3Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

// GET - Fetch all tweets
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const tweets = await prisma.tweet.findMany({
      where: {
        isRetweet: false,
        replyToId: null,
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
        comments: {
          orderBy: {
            createdAt: "asc",
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
            likes: session?.user ? {
              where: {
                userId: session.user.id,
              },
              select: {
                id: true,
              },
            } : false,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            retweets: true,
          },
        },
        likes: session?.user ? {
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
          },
        } : false,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const tweetsWithLikeStatus = tweets.map((tweet) => ({
      ...tweet,
      isLiked: session?.user ? tweet.likes.length > 0 : false,
      likes: undefined,
    }));

    return NextResponse.json({ tweets: tweetsWithLikeStatus });
  } catch (error) {
    console.error("Error fetching tweets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tweets" },
      { status: 500 }
    );
  }
}

// POST - Create a new tweet
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, imageKeys = [], replyToId = null } = body;

    if ((!content || content.trim().length === 0) && imageKeys.length === 0) {
      return NextResponse.json(
        { error: "Content or image is required" },
        { status: 400 }
      );
    }

    if (content && content.length > 280) {
      return NextResponse.json(
        { error: "Content must be 280 characters or less" },
        { status: 400 }
      );
    }

    const tweet = await prisma.tweet.create({
      data: {
        content: content ? content.trim() : "",
        imageKeys: imageKeys,
        userId: session.user.id,
        replyToId: replyToId,
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
        comments: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            retweets: true,
          },
        },
      },
    });

    // Emit socket event for real-time update
    try {
      const io = (global as any).io;
      if (io) {
        io.emit("newTweet", tweet);
      }
    } catch (error) {
      console.log("Socket emit failed:", error);
    }

    return NextResponse.json({ tweet }, { status: 201 });
  } catch (error) {
    console.error("Error creating tweet:", error);
    return NextResponse.json(
      { error: "Failed to create tweet" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a tweet
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tweetId = searchParams.get("tweetId");

    if (!tweetId) {
      return NextResponse.json(
        { error: "Tweet ID is required" },
        { status: 400 }
      );
    }

    // Check if tweet exists and belongs to user
    const tweet = await prisma.tweet.findUnique({
      where: { id: tweetId },
    });

    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    if (tweet.userId !== session.user.id && (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete images from S3 if they exist
    if (tweet.imageKeys && tweet.imageKeys.length > 0) {
      try {
        for (const key of tweet.imageKeys) {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            Key: key,
          });
          await S3.send(deleteCommand);
          console.log(`✅ Deleted image from S3: ${key}`);
        }
      } catch (s3Error) {
        console.error("Error deleting images from S3:", s3Error);
        // Continue with tweet deletion even if S3 deletion fails
      }
    }

    await prisma.tweet.delete({
      where: { id: tweetId },
    });

    // Emit socket event for real-time update
    try {
      const io = (global as any).io;
      if (io) {
        io.emit("deleteTweet", tweetId);
      }
    } catch (error) {
      console.log("Socket emit failed:", error);
    }

    return NextResponse.json({ message: "Tweet deleted successfully" });
  } catch (error) {
    console.error("Error deleting tweet:", error);
    return NextResponse.json(
      { error: "Failed to delete tweet" },
      { status: 500 }
    );
  }
}

// PUT - Update a tweet
export async function PUT(request: NextRequest) {
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
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.length > 280) {
      return NextResponse.json(
        { error: "Content must be 280 characters or less" },
        { status: 400 }
      );
    }

    // Check if tweet exists and belongs to user
    const tweet = await prisma.tweet.findUnique({
      where: { id: tweetId },
    });

    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    if (tweet.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedTweet = await prisma.tweet.update({
      where: { id: tweetId },
      data: { content: content.trim() },
    });

    // Emit socket event for real-time update
    try {
      const io = (global as any).io;
      if (io) {
        io.emit("updateTweet", { tweetId, content: content.trim() });
      }
    } catch (error) {
      console.log("Socket emit failed:", error);
    }

    return NextResponse.json({ tweet: updatedTweet });
  } catch (error) {
    console.error("Error updating tweet:", error);
    return NextResponse.json(
      { error: "Failed to update tweet" },
      { status: 500 }
    );
  }
}
