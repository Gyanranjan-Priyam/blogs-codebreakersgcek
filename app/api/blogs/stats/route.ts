import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const { blogIds } = await request.json();

    if (!Array.isArray(blogIds)) {
      return NextResponse.json(
        { error: "blogIds must be an array" },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Get counts for all blogs
    const blogs = await prisma.blog.findMany({
      where: {
        id: {
          in: blogIds,
        },
      },
      select: {
        id: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // Get user's likes if authenticated
    let userLikes: string[] = [];
    if (session?.user) {
      const likes = await prisma.blogLike.findMany({
        where: {
          userId: session.user.id,
          blogId: {
            in: blogIds,
          },
        },
        select: {
          blogId: true,
        },
      });
      userLikes = likes.map(like => like.blogId);
    }

    // Format response
    const stats = blogs.reduce((acc, blog) => {
      acc[blog.id] = {
        likeCount: blog._count.likes,
        commentCount: blog._count.comments,
        isLiked: userLikes.includes(blog.id),
      };
      return acc;
    }, {} as Record<string, { likeCount: number; commentCount: number; isLiked: boolean }>);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching blog stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog stats" },
      { status: 500 }
    );
  }
}
