"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ShortUrlRedirect() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState(false);
  const code = params?.code as string || "";

  useEffect(() => {
    const redirect = async () => {
      if (!code) {
        setError(true);
        return;
      }

      try {
        const response = await fetch(`/api/short-url?code=${code}`);
        
        if (response.ok) {
          const data = await response.json();
          window.location.href = data.originalUrl;
        } else {
          setError(true);
        }
      } catch (error) {
        console.error("Error redirecting:", error);
        setError(true);
      }
    };

    redirect();
  }, [code]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-destructive">404</h1>
          <p className="text-xl text-muted-foreground">Short URL not found</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
