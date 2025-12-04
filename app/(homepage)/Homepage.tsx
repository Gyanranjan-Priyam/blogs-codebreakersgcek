"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Header } from "./_components/Header";
import { MobileSearch } from "./_components/MobileSearch";
import BlogCard from "@/components/blogs/BlogCard";

interface Blog {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  tags: string[];
  thumbnailKey: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
}

export default function BlogHomepage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    fetchSession();
    fetchBlogs();
  }, []);

  // Search effect with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredBlogs(blogs);
        return;
      }

      const query = searchQuery.toLowerCase().trim();
      const filtered = blogs.filter(blog => {
        // Search in title
        const titleMatch = blog.title.toLowerCase().includes(query);
        
        // Search in short description
        const descriptionMatch = blog.shortDescription.toLowerCase().includes(query);
        
        // Search in author name
        const authorMatch = blog.user.name.toLowerCase().includes(query);
        
        // Search in tags
        const tagMatch = blog.tags.some(tag => tag.toLowerCase().includes(query));
        
        return titleMatch || descriptionMatch || authorMatch || tagMatch;
      });

      setFilteredBlogs(filtered);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, blogs]);

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

  const fetchBlogs = async () => {
    try {
      const response = await fetch("/api/blogs");
      if (response.ok) {
        const data = await response.json();
        setBlogs(data.blogs);
        setFilteredBlogs(data.blogs);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    setUser(null);
    toast.success("Logged out successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
      />

      <div className="max-w-7xl mx-auto w-full px-4 py-8">
        <MobileSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        
        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Found {filteredBlogs.length} result{filteredBlogs.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          </div>
        )}

        {filteredBlogs.length > 0 ? (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              {searchQuery ? 'Search Results' : 'Latest Blogs'}
            </h2>
            <BlogCard blogs={filteredBlogs} />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery 
                ? `No blogs found matching "${searchQuery}". Try searching for different keywords, author names, or tags.`
                : 'No blogs published yet. Be the first to share your knowledge!'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
