"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Loader } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FaDiscord, FaGithub, FaGoogle } from "react-icons/fa";
import { toast } from "sonner";
import Image from "next/image";

export function LoginForm() {
  const [githubPending, startGithubTransition] = useTransition();
  const [googlePending, startGoogleTransition] = useTransition();
  const [discordPending, startDiscordTransition] = useTransition();

  async function signInWithGithub() {
    startGithubTransition(async () => {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/auth/callback",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Redirecting for signed in with Github!");
          },
          onError: () => {
            toast.error("Internal Server Error");
          },
        },
      });
    });
  }
  async function signInWithGoogle() {
    startGoogleTransition(async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/auth/callback",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Redirecting for signed in with Google!");
          },
          onError: () => {
            toast.error("Internal Server Error");
          },
        },
      });
    });
  }
  async function signInWithDiscord() {
    startDiscordTransition(async () => {
      await authClient.signIn.social({
        provider: "discord",
        callbackURL: "/auth/callback",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Redirecting for signed in with Discord!");
          },
          onError: () => {
            toast.error("Internal Server Error");
          },
        },
      });
    });
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-6">
        <Image
          src="/assets/logo.png"
          alt="CodeBreakers Logo"
          width={70}
          height={70}
          className="mb-3"
          priority
        />
        <span className="text-2xl font-semibold text-center">
          CodeBreakers Blogs- {new Date().getFullYear()}
        </span>
      </div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <Button
          disabled={githubPending}
          onClick={signInWithGithub}
          variant="outline"
          className="cursor-pointer w-full"
        >
          {githubPending ? (
            <>
              <Loader className="size-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <FaGithub className="size-5" />
              <span>Sign In with Github</span>
            </>
          )}
        </Button>
        <Button
          disabled={googlePending}
          onClick={signInWithGoogle}
          variant="outline"
          className="cursor-pointer w-full"
        >
          {googlePending ? (
            <>
              <Loader className="size-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <FaGoogle className="size-5" />
              <span>Sign In with Google</span>
            </>
          )}
        </Button>
        <Button
          disabled={discordPending}
          onClick={signInWithDiscord}
          variant="outline"
          className="cursor-pointer w-full"
        >
          {discordPending ? (
            <>
              <Loader className="size-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <FaDiscord className="size-5" />
              <span>Sign In with Discord</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
