import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: blogId, commentId } = await params;
    
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the comment
    const comment = await prisma.blogComment.findUnique({
      where: { id: commentId },
      include: {
        blog: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if user is the comment author or the blog author
    const isCommentAuthor = comment.userId === session.user.id;
    const isBlogAuthor = comment.blog.userId === session.user.id;

    if (!isCommentAuthor && !isBlogAuthor) {
      return NextResponse.json(
        { error: "You don't have permission to delete this comment" },
        { status: 403 }
      );
    }

    // Delete the comment
    await prisma.blogComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
