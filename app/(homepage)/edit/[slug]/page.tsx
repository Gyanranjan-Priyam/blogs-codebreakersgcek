import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import EditBlogClient from "./EditBlogClient";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      title: "Edit Blog",
      description: "Edit your blog post",
    };
  }

  const blog = await prisma.blog.findUnique({
    where: { slug },
    select: {
      title: true,
      shortDescription: true,
    },
  });

  if (!blog) {
    return {
      title: "Blog Not Found",
      description: "The blog you're trying to edit could not be found.",
    };
  }

  return {
    title: `Edit: ${blog.title}`,
    description: blog.shortDescription || `Edit your blog post: ${blog.title}`,
  };
}

export default async function EditBlogPage({ params }: PageProps) {
  const { slug } = await params;

  // Get authenticated user
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch the blog with all components
  const blog = await prisma.blog.findUnique({
    where: { slug },
    include: {
      components: {
        orderBy: { order: "asc" },
      },
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  });

  if (!blog) {
    notFound();
  }

  // Check if user owns this blog
  if (blog.userId !== session.user.id) {
    redirect("/");
  }

  return <EditBlogClient blog={blog} />;
}
