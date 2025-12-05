"use client";

import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Heart, MessageCircle, Share2, UserPlus } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

interface Blog {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  tags: string[];
  thumbnailKey: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
}

interface BlogCardProps {
  blogs: Blog[];
}

interface BlogStats {
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

export default function BlogCard({ blogs }: BlogCardProps) {
  const [blogStats, setBlogStats] = useState<Record<string, BlogStats>>({});
  const [user, setUser] = useState<any>(null);
  const [updatingLike, setUpdatingLike] = useState<string | null>(null);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [updatingFollow, setUpdatingFollow] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
    fetchBlogStats();
    fetchFollowingStatus();

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchBlogStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [blogs]);

  const fetchUser = async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchBlogStats = async () => {
    if (blogs.length === 0) return;

    try {
      const response = await fetch("/api/blogs/stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blogIds: blogs.map(b => b.id),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBlogStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching blog stats:", error);
    }
  };

  const fetchFollowingStatus = async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (!session?.user) return;

      // Get unique user IDs from blogs, filtering out null/undefined
      const userIds = [...new Set(blogs.map(b => b.user.id).filter(id => id != null))];
      
      if (userIds.length === 0) return;
      
      const response = await fetch("/api/follow/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds }),
      });

      if (response.ok) {
        const data = await response.json();
        setFollowingUsers(new Set(data.followingIds));
      }
    } catch (error) {
      console.error("Error fetching following status:", error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  const handleShare = async (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const blogUrl = `${window.location.origin}/blogs/${slug}`;
    
    try {
      // Generate short URL
      const response = await fetch("/api/short-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: blogUrl,
          blogSlug: slug,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await navigator.clipboard.writeText(data.shortUrl);
        toast.success("Short link copied to clipboard!");
      } else {
        // Fallback to full URL
        await navigator.clipboard.writeText(blogUrl);
        toast.success("Blog link copied to clipboard!");
      }
    } catch (error) {
      // Fallback to full URL on error
      try {
        await navigator.clipboard.writeText(blogUrl);
        toast.success("Blog link copied to clipboard!");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  const handleLike = async (e: React.MouseEvent, blogId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to like blogs");
      return;
    }

    if (updatingLike) return;

    setUpdatingLike(blogId);
    
    // Optimistic update
    const currentStats = blogStats[blogId] || { likeCount: 0, commentCount: 0, isLiked: false };
    const newIsLiked = !currentStats.isLiked;
    const newLikeCount = newIsLiked ? currentStats.likeCount + 1 : currentStats.likeCount - 1;

    setBlogStats(prev => ({
      ...prev,
      [blogId]: {
        ...currentStats,
        isLiked: newIsLiked,
        likeCount: newLikeCount,
      },
    }));

    try {
      const response = await fetch(`/api/blogs/${blogId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setBlogStats(prev => ({
          ...prev,
          [blogId]: {
            ...currentStats,
            isLiked: data.liked,
            likeCount: data.likeCount,
          },
        }));
      } else {
        // Revert on error
        setBlogStats(prev => ({
          ...prev,
          [blogId]: currentStats,
        }));
        toast.error("Failed to update like");
      }
    } catch (error) {
      // Revert on error
      setBlogStats(prev => ({
        ...prev,
        [blogId]: currentStats,
      }));
      toast.error("Failed to update like");
    } finally {
      setUpdatingLike(null);
    }
  };

  const handleFollow = async (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to follow users");
      return;
    }

    if (user.id === userId) {
      toast.error("You cannot follow yourself");
      return;
    }

    if (updatingFollow) return;

    setUpdatingFollow(userId);
    const isFollowing = followingUsers.has(userId);

    // Optimistic update
    setFollowingUsers(prev => {
      const newSet = new Set(prev);
      if (isFollowing) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });

    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
      } else {
        // Revert on error
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          if (isFollowing) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
        toast.error("Failed to update follow status");
      }
    } catch (error) {
      // Revert on error
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        if (isFollowing) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
      toast.error("Failed to update follow status");
    } finally {
      setUpdatingFollow(null);
    }
  };

  return ( 
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog, index) => (
          <motion.div
            key={blog.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 overflow-hidden group">
              {/* Author Header */}
              <div className="px-4 flex items-center justify-between">
                <Link 
                  href={blog.user.username ? `/profile/${blog.user.username}` : '#'} 
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  onClick={(e) => {
                    if (!blog.user.username) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={blog.user.image || undefined} />
                    <AvatarFallback>{blog.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{blog.user.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(blog.createdAt)}</p>
                  </div>
                </Link>
                {user && user.id !== blog.user.id && (
                  <Button
                    variant={followingUsers.has(blog.user.id) ? "secondary" : "outline"}
                    size="sm"
                    onClick={(e) => handleFollow(e, blog.user.id)}
                    disabled={updatingFollow === blog.user.id}
                    className="h-8"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    {followingUsers.has(blog.user.id) ? "Following" : "Follow"}
                  </Button>
                )}
              </div>

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

                {/* Footer - Stats and Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <button
                      onClick={(e) => handleLike(e, blog.id)}
                      disabled={updatingLike === blog.id}
                      className="flex items-center gap-1 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Heart className={`h-4 w-4 ${blogStats[blog.id]?.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{blogStats[blog.id]?.likeCount || 0}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{blogStats[blog.id]?.commentCount || 0}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleShare(e, blog.slug)}
                    className="h-8 px-2"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}