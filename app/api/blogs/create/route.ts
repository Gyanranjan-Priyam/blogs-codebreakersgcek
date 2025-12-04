import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, slug, shortDescription, tags, thumbnail, thumbnailKey, content } = body;

    // Validate required fields
    if (!title || !slug || !shortDescription || !tags || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingBlog = await prisma.blog.findUnique({
      where: { slug },
    });

    if (existingBlog) {
      return NextResponse.json(
        { error: 'A blog with this URL already exists. Please modify the title to generate a unique URL.' },
        { status: 400 }
      );
    }

    // Create the blog
    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        shortDescription,
        tags: Array.isArray(tags) ? tags : [tags],
        thumbnailKey,
        userId: session.user.id,
        published: true,
      },
    });

    // Create blog components
    if (content.components && content.componentData) {
      const components = content.components;
      
      for (let i = 0; i < components.length; i++) {
        const component = components[i];
        const data = content.componentData[component.id];

        if (!data) continue;

        const componentData: any = {
          blogId: blog.id,
          type: component.type,
          order: i,
        };

        switch (component.type) {
          case 'richtext':
            componentData.content = typeof data === 'string' ? JSON.parse(data) : data;
            break;
          
          case 'imagetext':
            componentData.text = data.text || '';
            componentData.imageKey = data.imageKey || '';
            componentData.alignment = data.alignment || 'left';
            break;
          
          case 'imageuploader':
            componentData.imageKey = data.key || '';
            break;
          
          case 'videoplayer':
            componentData.videoUrl = data.url || '';
            componentData.videoType = data.type || '';
            break;
        }

        await prisma.blogComponent.create({
          data: componentData,
        });
      }
    }

    return NextResponse.json({
      success: true,
      blog: {
        id: blog.id,
        slug: blog.slug,
      },
      message: 'Blog published successfully',
    });

  } catch (error) {
    console.error('Blog creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}
