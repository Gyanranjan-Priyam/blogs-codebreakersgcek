import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function PUT(
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
    const existingBlog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: { components: true },
    });

    if (!existingBlog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    if (existingBlog.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to edit this blog" },
        { status: 403 }
      );
    }

    const { title, shortDescription, tags, thumbnailKey, components, published } = await request.json();

    // Generate slug from title if title changed
    let slug = existingBlog.slug;
    if (title !== existingBlog.title) {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      
      // Check if slug exists
      const existingSlug = await prisma.blog.findFirst({
        where: {
          slug: baseSlug,
          id: { not: blogId },
        },
      });

      slug = existingSlug ? `${baseSlug}-${Date.now()}` : baseSlug;
    }

    // Delete existing components
    await prisma.blogComponent.deleteMany({
      where: { blogId },
    });

    // Update blog with new components
    const updatedBlog = await prisma.blog.update({
      where: { id: blogId },
      data: {
        title,
        slug,
        shortDescription,
        tags,
        thumbnailKey,
        published,
        components: {
          create: components.map((comp: any, index: number) => ({
            type: comp.type,
            order: index,
            content: comp.content,
            text: comp.text,
            imageKey: comp.imageKey,
            alignment: comp.alignment,
            videoUrl: comp.videoUrl,
            videoType: comp.videoType,
          })),
        },
      },
      include: {
        components: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    );
  }
}

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
