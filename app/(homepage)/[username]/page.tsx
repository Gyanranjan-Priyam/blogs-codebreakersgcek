"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, Calendar, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string | null;
  bio: string | null;
  createdAt: string;
  profileImageKey: string | null;
  coverImageKey: string | null;
  _count: {
    tweets: number;
    followers: number;
    following: number;
  };
}

interface Tweet {
  id: string;
  content: string;
  imageKeys: string[];
  createdAt: string;
  _count: {
    likes: number;
    comments: number;
  };
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchProfile();
  }, [username]);

  const fetchCurrentUser = async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        // If viewing own profile, redirect to /profile/[username]
        if ((session.user as any).username === username) {
          router.push(`/profile/${username}`);
        }
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/user/profile/${username}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setTweets(data.tweets);
        setIsFollowing(data.isFollowing);
      } else {
        toast.error("User not found");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error("Please login to follow users");
      return;
    }

    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile?.id }),
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        toast.success(isFollowing ? "Unfollowed" : "Followed");
      }
    } catch (error) {
      toast.error("Failed to follow/unfollow");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Image
                src="/assets/logo.png"
                alt="CodeBreakers Logo"
                width={40}
                height={40}
                priority
              />
              <h1 className="text-xl font-bold">CodeBreakers Blogs</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="border-b border-border">
          {/* Cover Image */}
          <div className="relative h-48 bg-linear-to-r from-blue-500 to-purple-600">
            {profile.coverImageKey && (
              <Image
                src={`https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${profile.coverImageKey}`}
                alt="Cover"
                fill
                className="object-cover"
                priority
              />
            )}
          </div>
          
          <div className="px-4 pb-4">
            <div className="flex justify-between items-start -mt-16 mb-4">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={profile.image || undefined} />
                <AvatarFallback className="text-4xl">{profile.name[0]}</AvatarFallback>
              </Avatar>
              
              {currentUser && (
                <Button
                  onClick={handleFollow}
                  variant={isFollowing ? "outline" : "default"}
                  className="mt-16"
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>

              {profile.bio && (
                <p className="text-sm">{profile.bio}</p>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
              </div>

              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-bold">{profile._count.following}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </div>
                <div>
                  <span className="font-bold">{profile._count.followers}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tweets" className="w-full ">
          <TabsList className="w-full justify-start rounded-full border-b">
            <TabsTrigger value="tweets" className="flex-1">
              Tweets ({profile._count.tweets})
            </TabsTrigger>
            <TabsTrigger value="replies" className="flex-1">
              Replies
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex-1">
              Likes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tweets" className="mt-0">
            {tweets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No tweets yet
              </div>
            ) : (
              tweets.map((tweet) => (
                <Card
                  key={tweet.id}
                  className="border-x-0 border-t-0 border-b border-border rounded-none bg-transparent p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarImage src={profile.image || undefined} />
                      <AvatarFallback>{profile.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{profile.name}</span>
                        <span className="text-muted-foreground">@{profile.username}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground text-sm">
                          {new Date(tweet.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap">{tweet.content}</p>
                      
                      {/* Tweet Images */}
                      {tweet.imageKeys && tweet.imageKeys.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {tweet.imageKeys.map((key, index) => (
                            <div key={index} className="relative w-full h-64 rounded-lg overflow-hidden">
                              <Image
                                src={`https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${key}`}
                                alt={`Tweet image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-6 mt-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-5 w-5" />
                          <span>{tweet._count.comments}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="h-5 w-5" />
                          <span>{tweet._count.likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="replies" className="mt-0">
            <div className="p-8 text-center text-muted-foreground">
              Replies feature coming soon
            </div>
          </TabsContent>

          <TabsContent value="likes" className="mt-0">
            <div className="p-8 text-center text-muted-foreground">
              Liked tweets coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
