import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: blogId } = await params;
    
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.blogLike.findUnique({
      where: {
        userId_blogId: {
          userId: session.user.id,
          blogId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.blogLike.delete({
        where: {
          userId_blogId: {
            userId: session.user.id,
            blogId,
          },
        },
      });

      const likeCount = await prisma.blogLike.count({
        where: { blogId },
      });

      return NextResponse.json({
        liked: false,
        likeCount,
      });
    } else {
      // Like
      await prisma.blogLike.create({
        data: {
          userId: session.user.id,
          blogId,
        },
      });

      const likeCount = await prisma.blogLike.count({
        where: { blogId },
      });

      return NextResponse.json({
        liked: true,
        likeCount,
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: blogId } = await params;
    
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const likeCount = await prisma.blogLike.count({
      where: { blogId },
    });

    let isLiked = false;
    if (session?.user) {
      const existingLike = await prisma.blogLike.findUnique({
        where: {
          userId_blogId: {
            userId: session.user.id,
            blogId,
          },
        },
      });
      isLiked = !!existingLike;
    }

    return NextResponse.json({
      likeCount,
      isLiked,
    });
  } catch (error) {
    console.error("Error fetching likes:", error);
    return NextResponse.json(
      { error: "Failed to fetch likes" },
      { status: 500 }
    );
  }
}
