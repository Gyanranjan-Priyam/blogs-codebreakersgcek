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

    // Check if already retweeted
    const existingRetweet = await prisma.retweet.findUnique({
      where: {
        userId_tweetId: {
          userId: session.user.id,
          tweetId: tweetId,
        },
      },
    });

    if (existingRetweet) {
      // Undo retweet
      await prisma.retweet.delete({
        where: {
          id: existingRetweet.id,
        },
      });
      return NextResponse.json({ message: "Retweet removed", retweeted: false });
    } else {
      // Retweet
      await prisma.retweet.create({
        data: {
          userId: session.user.id,
          tweetId: tweetId,
        },
      });
      return NextResponse.json({ message: "Tweet retweeted", retweeted: true });
    }
  } catch (error) {
    console.error("Error retweeting tweet:", error);
    return NextResponse.json(
      { error: "Failed to retweet" },
      { status: 500 }
    );
  }
}
