import { auth } from "@/lib/auth";
import { S3 } from "@/lib/s3Client";
import { env } from "@/lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'profile', 'cover', or 'tweet'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size based on type
    let maxSize: number;
    if (type === "profile") {
      maxSize = 102400; // 100KB
    } else if (type === "cover") {
      maxSize = 204800; // 200KB
    } else if (type === "tweet") {
      maxSize = 512000; // 500KB
    } else {
      maxSize = 512000; // Default 500KB
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max size: ${maxSize / 1024}KB` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Generate unique key
    const uniqueKey = `${uuidv4()}-${file.name}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: uniqueKey,
      Body: buffer,
      ContentType: file.type,
      ContentLength: file.size,
    });

    await S3.send(command);

    // Return the key and URL
    const url = `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${uniqueKey}`;

    return NextResponse.json({
      success: true,
      key: uniqueKey,
      url,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
