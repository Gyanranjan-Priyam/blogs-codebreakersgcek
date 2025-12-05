import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Generate a random short code
function generateShortCode(length: number = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a short URL
export async function POST(req: NextRequest) {
  try {
    const { url, blogSlug } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Check if short URL already exists for this blog
    if (blogSlug) {
      const existing = await prisma.shortUrl.findFirst({
        where: { blogSlug },
      });

      if (existing) {
        const shortUrl = `${new URL(url).origin}/s/${existing.shortCode}`;
        return NextResponse.json({ shortUrl, shortCode: existing.shortCode });
      }
    }

    // Generate a unique short code
    let shortCode = generateShortCode(6);
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const exists = await prisma.shortUrl.findUnique({
        where: { shortCode },
      });

      if (!exists) break;
      shortCode = generateShortCode(6);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: "Failed to generate unique short code" },
        { status: 500 }
      );
    }

    // Create short URL
    const shortUrl = await prisma.shortUrl.create({
      data: {
        shortCode,
        originalUrl: url,
        blogSlug: blogSlug || null,
      },
    });

    const shortUrlFull = `${new URL(url).origin}/s/${shortCode}`;
    return NextResponse.json({ shortUrl: shortUrlFull, shortCode });
  } catch (error) {
    console.error("Error creating short URL:", error);
    return NextResponse.json(
      { error: "Failed to create short URL" },
      { status: 500 }
    );
  }
}

// Get short URL by code
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Short code is required" },
        { status: 400 }
      );
    }

    const shortUrl = await prisma.shortUrl.findUnique({
      where: { shortCode: code },
    });

    if (!shortUrl) {
      return NextResponse.json(
        { error: "Short URL not found" },
        { status: 404 }
      );
    }

    // Increment click count
    await prisma.shortUrl.update({
      where: { shortCode: code },
      data: { clicks: { increment: 1 } },
    });

    return NextResponse.json({
      originalUrl: shortUrl.originalUrl,
      clicks: shortUrl.clicks + 1,
    });
  } catch (error) {
    console.error("Error fetching short URL:", error);
    return NextResponse.json(
      { error: "Failed to fetch short URL" },
      { status: 500 }
    );
  }
}
