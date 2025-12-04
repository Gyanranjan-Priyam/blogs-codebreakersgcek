import arcjet, {  fixedWindow } from "@/lib/arcjet";
import { env } from "@/lib/env";
import { S3 } from "@/lib/s3Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const aj = arcjet
    .withRule(
        fixedWindow({
            mode: 'LIVE',
            window: '1m',
            max: 10,
        })
    );

export async function POST(request: Request) {
    // Check if user is authenticated
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized. Please login to delete files." }, { status: 401 });
    }

    try {
        const body = await request.json();
        const keys = body.keys;

        const decision = await aj.protect(request, {
            fingerprint: session.user.id as string,
        });
        
        if (decision.isDenied()) {
            return NextResponse.json({error: "Too many requests"}, {status: 429});
        }

        if(!keys || !Array.isArray(keys) || keys.length === 0) {
            return NextResponse.json(
                {error: "Missing or invalid 'keys' array in request body"},
                {status: 400}
            );
        }

        // Delete all images
        const deletePromises = keys.map(key => {
            const command = new DeleteObjectCommand({
                Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
                Key: key,
            });
            return S3.send(command);
        });

        await Promise.all(deletePromises);

        return NextResponse.json(
            {message: `${keys.length} file(s) deleted successfully`},
            {status: 200}
        );
    } catch (error) {
        console.error("Error deleting files:", error);
        return NextResponse.json(
            {error: "Failed to delete files"},
            {status: 500}
        );
    }
}

export async function DELETE(request: Request) {

    // Check if user is authenticated (not just admin)
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized. Please login to delete files." }, { status: 401 });
    }

    try {
        const body = await request.json();

        const key = body.key;

        const decision = await aj.protect(request, {
            fingerprint: session.user.id as string,
        });
        
        if (decision.isDenied()) {
            return NextResponse.json({error: "Too many requests"}, {status: 420});
        }

        if(!key) {
            return NextResponse.json(
                {error: "Missing 'key' in request body"},
                {status: 400}
            );
        }

        const command = new DeleteObjectCommand({
            Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            Key: key,
        });

        await S3.send(command);

        return NextResponse.json(
            {message: "File deleted successfully"},
            {status: 200}
        )
    } catch {
        return NextResponse.json(
            {error: "Failed to delete file"},
            {status: 500}
        )
    }
}