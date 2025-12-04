import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import BlogDetailClient from "./BlogDetailClient";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getBlog(slug: string) {
  const blog = await prisma.blog.findFirst({
    where: {
      slug,
      published: true,
    },
    include: {
      user: {
        select: {
          name: true,
          username: true,
          image: true,
          id: true,
        },
      },
      components: {
        orderBy: {
          order: 'asc',
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  if (!blog) {
    return null;
  }

  return blog;
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
  }

  // Convert blog components to the format expected by BlogPreview
  const components = blog.components.map((comp) => ({
    id: comp.id,
    type: comp.type as "richtext" | "imagetext" | "imageuploader" | "videoplayer",
  }));

  const componentData: Record<string, any> = {};
  blog.components.forEach((comp) => {
    switch (comp.type) {
      case 'richtext':
        componentData[comp.id] = comp.content;
        break;
      case 'imagetext':
        componentData[comp.id] = {
          text: comp.text,
          image: comp.imageKey ? `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${comp.imageKey}` : '',
          imageKey: comp.imageKey,
          alignment: comp.alignment,
        };
        break;
      case 'imageuploader':
        componentData[comp.id] = {
          key: comp.imageKey,
          url: comp.imageKey ? `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${comp.imageKey}` : '',
        };
        break;
      case 'videoplayer':
        componentData[comp.id] = {
          url: comp.videoUrl,
          type: comp.videoType,
        };
        break;
    }
  });

  const thumbnailUrl = blog.thumbnailKey 
    ? `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${blog.thumbnailKey}`
    : '';

  const blogData = {
    id: blog.id,
    authorId: blog.userId,
    title: blog.title,
    thumbnailUrl,
    shortDescription: blog.shortDescription,
    tags: blog.tags.join(", "),
    components,
    componentData,
    authorName: blog.user.name,
    authorUsername: blog.user.username,
    publishedDate: blog.createdAt.toISOString(),
    likeCount: blog._count.likes,
    commentCount: blog._count.comments,
  };

  return <BlogDetailClient blog={blogData} />;
}
