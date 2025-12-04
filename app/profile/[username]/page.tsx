"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Home, Edit, Trash2, Heart, MessageCircle, Share2, Settings } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string | null;
  bio: string | null;
  createdAt: string;
  _count: {
    followers: number;
    following: number;
  };
}

interface Blog {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  tags: string[];
  thumbnailKey: string | null;
  createdAt: Date;
  published: boolean;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingBack, setIsFollowingBack] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [blogStats, setBlogStats] = useState<Record<string, { likeCount: number; commentCount: number }>>({});

  useEffect(() => {
    if (username) {
      fetchCurrentUser();
      fetchProfile();
    }
  }, [username]);

  useEffect(() => {
    if (profile) {
      document.title = `${profile.name} (@${profile.username}) | Codebreakers Blog`;
    }
  }, [profile]);

  const fetchCurrentUser = async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
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
        setIsFollowing(data.isFollowing);
        setIsFollowingBack(data.isFollowingBack);
        
        // Fetch user's blogs
        const blogsResponse = await fetch(`/api/blogs?userId=${data.user.id}`);
        if (blogsResponse.ok) {
          const blogsData = await blogsResponse.json();
          const blogsList = blogsData.blogs || [];
          setBlogs(blogsList);
          
          // Fetch blog stats
          if (blogsList.length > 0) {
            fetchBlogStats(blogsList.map((b: Blog) => b.id));
          }
        }
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

  const fetchBlogStats = async (blogIds: string[]) => {
    try {
      const response = await fetch("/api/blogs/stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ blogIds }),
      });

      if (response.ok) {
        const data = await response.json();
        setBlogStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching blog stats:", error);
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
        const wasFollowing = isFollowing;
        setIsFollowing(!isFollowing);
        
        // Update follower count in real-time
        if (profile) {
          setProfile({
            ...profile,
            _count: {
              ...profile._count,
              followers: wasFollowing ? profile._count.followers - 1 : profile._count.followers + 1,
            },
          });
        }
        
        toast.success(wasFollowing ? "Unfollowed" : "Followed");
      }
    } catch (error) {
      toast.error("Failed to follow/unfollow");
    }
  };

  const handleDeleteBlog = async () => {
    if (!blogToDelete) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/blogs/${blogToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Blog deleted successfully");
        setBlogs(blogs.filter(blog => blog.id !== blogToDelete));
        setDeleteDialogOpen(false);
        setBlogToDelete(null);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete blog");
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Failed to delete blog");
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = async (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    const blogUrl = `${window.location.origin}/blogs/${slug}`;
    try {
      await navigator.clipboard.writeText(blogUrl);
      toast.success("Blog link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const getThumbnailUrl = (thumbnailKey: string | null) => {
    if (!thumbnailKey) return null;
    return `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${thumbnailKey}`;
  };

  const getGradient = (index: number) => {
    const gradients = [
      'from-blue-500 via-purple-500 to-pink-500',
      'from-emerald-500 via-teal-500 to-cyan-500',
      'from-orange-500 via-red-500 to-pink-500',
      'from-violet-500 via-purple-500 to-indigo-500',
      'from-amber-500 via-orange-500 to-red-500',
      'from-green-500 via-emerald-500 to-teal-500',
    ];
    return gradients[index % gradients.length];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
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
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            {isOwnProfile && (
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Section - No Cover Image */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-32 w-32 border-4 border-border">
              <AvatarImage src={profile.image || undefined} />
              <AvatarFallback className="text-4xl">{profile.name[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 w-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold">{profile.name}</h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                </div>
                
                {!isOwnProfile && currentUser && (
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                  >
                    {isFollowing ? "Following" : (isFollowingBack ? "Follow Back" : "Follow")}
                  </Button>
                )}
              </div>

              {profile.bio && (
                <p className="text-sm mb-4">{profile.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                </div>
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

        {/* Blogs Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {isOwnProfile ? "My Blogs" : `${profile.name}'s Blogs`} ({blogs.length})
          </h2>
          
          {blogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isOwnProfile ? "You haven't published any blogs yet." : "No blogs published yet."}
              </p>
              {isOwnProfile && (
                <Link href="/create">
                  <Button className="mt-4">Create Your First Blog</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog, index) => (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 overflow-hidden group">
                    {/* Thumbnail */}
                    <Link href={`/blogs/${blog.slug}`}>
                      <div className="relative h-48 overflow-hidden cursor-pointer">
                        {blog.thumbnailKey ? (
                          <img
                            src={getThumbnailUrl(blog.thumbnailKey)!}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className={`w-full h-full bg-linear-to-br ${getGradient(index)} flex items-center justify-center p-6 group-hover:scale-105 transition-transform duration-300`}>
                            <h3 className="text-2xl font-bold text-white text-center line-clamp-3">
                              {blog.title}
                            </h3>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Content */}
                    <CardContent className="px-4 py-3 space-y-2.5">
                      <Link href={`/blogs/${blog.slug}`}>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 cursor-pointer">
                          {blog.title}
                        </h3>
                      </Link>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {blog.shortDescription}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {blog.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            <span>{blogStats[blog.id]?.likeCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{blogStats[blog.id]?.commentCount || 0}</span>
                          </div>
                          <span className="text-xs">{formatDate(blog.createdAt)}</span>
                        </div>
                        
                        {isOwnProfile ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/create?edit=${blog.slug}`)}
                              className="h-8 px-2"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setBlogToDelete(blog.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="h-8 px-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleShare(e, blog.slug)}
                            className="h-8 px-2"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your blog and all its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBlog}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
