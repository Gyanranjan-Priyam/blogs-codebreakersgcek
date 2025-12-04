"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { Header } from "@/app/(homepage)/_components/Header";
import { BlogPreview } from "@/app/(homepage)/create/_components/blog-preview";
import { Heart, MessageCircle, Send, MoreVertical, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BlogDetailClientProps {
  blog: {
    id: string;
    slug: string;
    authorId: string;
    title: string;
    thumbnailUrl: string;
    shortDescription: string;
    tags: string;
    components: any[];
    componentData: Record<string, any>;
    authorName: string;
    authorUsername: string | null;
    publishedDate: string;
    likeCount: number;
    commentCount: number;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
}

export default function BlogDetailClient({ blog }: BlogDetailClientProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(blog.likeCount);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likingPost, setLikingPost] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
    fetchLikeStatus();
    fetchComments();
  }, []);

  useEffect(() => {
    if (blog) {
      document.title = `${blog.title} | Codebreakers Blog`;
    }
  }, [blog]);

  const fetchSession = async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        if (!(session.user as any).username) {
          console.log("Username missing, attempting to refetch...");
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data: refreshedSession } = await authClient.getSession();
          if (refreshedSession?.user) {
            setUser(refreshedSession.user);
          }
        } else {
          setUser(session.user);
        }
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    setUser(null);
    toast.success("Logged out successfully");
  };

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/blogs/${blog.id}/like`);
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error("Error fetching like status:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/blogs/${blog.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like this blog");
      setLoginDialogOpen(true);
      return;
    }

    if (likingPost) return;

    setLikingPost(true);
    const previousLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      const response = await fetch(`/api/blogs/${blog.id}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikeCount(data.likeCount);
      } else {
        // Revert on error
        setIsLiked(previousLiked);
        setLikeCount(previousCount);
        toast.error("Failed to update like");
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error("Failed to update like");
    } finally {
      setLikingPost(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to comment");
      setLoginDialogOpen(true);
      return;
    }

    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setSubmittingComment(true);

    try {
      const response = await fetch(`/api/blogs/${blog.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: commentText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setCommentText("");
        toast.success("Comment added");
      } else {
        toast.error("Failed to post comment");
      }
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!user || !commentToDelete) return;

    setDeletingCommentId(commentToDelete);

    try {
      const response = await fetch(`/api/blogs/${blog.id}/comments/${commentToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentToDelete));
        toast.success("Comment deleted");
      } else {
        toast.error("Failed to delete comment");
      }
    } catch (error) {
      toast.error("Failed to delete comment");
    } finally {
      setDeletingCommentId(null);
      setCommentToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        user={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loginDialogOpen={loginDialogOpen}
        setLoginDialogOpen={setLoginDialogOpen}
        handleLogout={handleLogout}
        hideCreateButton={true}
      />

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Edit Button for Blog Owner */}
          {user && user.id === blog.authorId && (
            <div className="mb-4 flex justify-end">
              <Link href={`/edit/${blog.slug}`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Blog
                </Button>
              </Link>
            </div>
          )}

          <BlogPreview
            title={blog.title}
            thumbnail={blog.thumbnailUrl}
            shortDescription={blog.shortDescription}
            tags={blog.tags}
            components={blog.components}
            componentData={blog.componentData}
            authorName={blog.authorName}
            authorUsername={blog.authorUsername}
            publishedDate={blog.publishedDate}
          />

          {/* Like and Comment Section */}
          <Card className="mt-6 p-6">
            {/* Like and Comment Counts */}
            <div className="flex items-center gap-6 mb-6">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                disabled={likingPost}
                className="flex items-center gap-2"
              >
                <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                <span>{likeCount}</span>
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <span>{comments.length}</span>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.image || undefined} />
                  <AvatarFallback>{user?.name?.[0] || "G"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={user ? "Write a comment..." : "Please login to comment"}
                    disabled={!user || submittingComment}
                    className="min-h-20 resize-none border-gray-400"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!user || submittingComment || !commentText.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {submittingComment ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                Comments ({comments.length})
              </h3>
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-4 rounded-lg bg-muted/50">
                    <Link href={`/profile/${comment.user.username}`}>
                      <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage src={comment.user.image || undefined} />
                        <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${comment.user.username}`} className="hover:underline">
                            <span className="font-semibold">{comment.user.name}</span>
                          </Link>
                          <Link href={`/profile/${comment.user.username}`} className="hover:underline">
                            <span className="text-sm text-muted-foreground">
                              @{comment.user.username}
                            </span>
                          </Link>
                          <span className="text-sm text-muted-foreground">
                            · {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {user && (user.id === comment.user.id || user.id === blog.authorId) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={deletingCommentId === comment.id}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setCommentToDelete(comment.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Comment Confirmation Dialog */}
      <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
