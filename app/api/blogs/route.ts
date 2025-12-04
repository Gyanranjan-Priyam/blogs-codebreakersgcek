import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const where: any = {};
    
    if (userId) {
      // If userId is provided, fetch all blogs by that user (including unpublished for profile)
      where.userId = userId;
    } else {
      // Otherwise, only fetch published blogs for homepage
      where.published = true;
    }

    const blogs = await prisma.blog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}
