import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function DELETE(
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

    // Check if blog exists and belongs to the user
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    if (blog.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this blog" },
        { status: 403 }
      );
    }

    // Delete blog components first (due to foreign key constraint)
    await prisma.blogComponent.deleteMany({
      where: { blogId },
    });

    // Delete the blog
    await prisma.blog.delete({
      where: { id: blogId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    );
  }
}
