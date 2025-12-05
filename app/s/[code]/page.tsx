import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;

  try {
    const shortUrl = await prisma.shortUrl.findUnique({
      where: { shortCode: code },
    });

    if (!shortUrl || !shortUrl.blogSlug) {
      return {
        title: "Short URL",
        description: "Redirecting...",
      };
    }

    // Fetch the blog to get metadata
    const blog = await prisma.blog.findFirst({
      where: { slug: shortUrl.blogSlug },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!blog) {
      return {
        title: "Short URL",
        description: "Redirecting...",
      };
    }

    return {
      title: blog.title,
      description: blog.shortDescription || `Read ${blog.title} by ${blog.user.name}`,
      openGraph: {
        title: blog.title,
        description: blog.shortDescription || `Read ${blog.title} by ${blog.user.name}`,
        type: "article",
        authors: [blog.user.name || "Anonymous"],
        publishedTime: blog.createdAt.toISOString(),
        tags: blog.tags,
        images: blog.thumbnailKey
          ? [`https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${blog.thumbnailKey}`]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: blog.title,
        description: blog.shortDescription || `Read ${blog.title} by ${blog.user.name}`,
        images: blog.thumbnailKey
          ? [`https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${blog.thumbnailKey}`]
          : [],
      },
    };
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return {
      title: "Short URL",
      description: "Redirecting...",
    };
  }
}

export default async function ShortUrlRedirect({ params }: PageProps) {
  const { code } = await params;

  try {
    const shortUrl = await prisma.shortUrl.findUnique({
      where: { shortCode: code },
    });

    if (!shortUrl) {
      notFound();
    }

    // Increment click count (non-blocking)
    prisma.shortUrl
      .update({
        where: { shortCode: code },
        data: { clicks: { increment: 1 } },
      })
      .catch((err) => console.error("Failed to update click count:", err));

    // Redirect to the original URL
    redirect(shortUrl.originalUrl);
  } catch (error) {
    console.error("Error redirecting:", error);
    notFound();
  }
}
