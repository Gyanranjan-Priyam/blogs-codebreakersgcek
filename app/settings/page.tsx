"use client";

import { useState, useEffect, useRef } from "react";
import { useEffect as useMetaEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Loader2, Check, X, Home } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { useDebounce } from "@/hooks/use-debounce";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [originalUsername, setOriginalUsername] = useState("");
  
  // Username availability state
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const debouncedUsername = useDebounce(username, 500);
  
  const profileImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Settings | Codebreakers Blog";
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const checkUsernameAvailability = async () => {
      // Don't check if username is empty or same as original
      if (!debouncedUsername || debouncedUsername === originalUsername) {
        setUsernameAvailable(null);
        setUsernameSuggestions([]);
        return;
      }

      // Validate format first
      if (debouncedUsername.length < 3 || !/^[a-z0-9_]+$/.test(debouncedUsername)) {
        setUsernameAvailable(null);
        setUsernameSuggestions([]);
        return;
      }

      setCheckingUsername(true);
      try {
        const response = await fetch(`/api/user/check-username?username=${debouncedUsername}`);
        const data = await response.json();
        
        setUsernameAvailable(data.available);
        
        if (!data.available) {
          // Generate suggestions based on name
          const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const suggestions: string[] = [];
          
          for (let i = 0; i < 4; i++) {
            const randomNum = Math.floor(Math.random() * 9000) + 1000; // 4-digit random number
            suggestions.push(`${baseName}${randomNum}`);
          }
          
          setUsernameSuggestions(suggestions);
        } else {
          setUsernameSuggestions([]);
        }
      } catch (error) {
        console.error("Error checking username:", error);
      } finally {
        setCheckingUsername(false);
      }
    };

    checkUsernameAvailability();
  }, [debouncedUsername, originalUsername, name]);

  const fetchCurrentUser = async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        setName(session.user.name || "");
        const userUsername = (session.user as any).username || "";
        setUsername(userUsername);
        setOriginalUsername(userUsername);
        setBio((session.user as any).bio || "");
        setProfileImagePreview(session.user.image || null);
      } else {
        toast.error("Please login to access settings");
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB = 5242880 bytes)
      if (file.size > 5242880) {
        toast.error("Profile picture must be less than 5MB");
        return;
      }

      // Check if it's an image
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImageToS3 = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'profile');

      const response = await fetch("/api/user/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image");
      }

      const { key } = await response.json();
      return key;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      toast.error("Username can only contain lowercase letters, numbers, and underscores");
      return;
    }

    setUpdating(true);

    try {
      let profileImageKey = (currentUser as any)?.profileImageKey || undefined;

      // Upload profile image if changed
      if (profileImage) {
        const key = await uploadImageToS3(profileImage);
        if (key) {
          profileImageKey = key;
        } else {
          setUpdating(false);
          return;
        }
      }

      // Update profile
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          bio,
          profileImageKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update profile");
        setUpdating(false);
        return;
      }

      toast.success("Profile updated successfully!");
      
      // Refresh session to get updated data
      await authClient.getSession();
      
      // If username changed, redirect to new profile URL
      if (username !== (currentUser as any).username) {
        router.push(`/profile/${username}`);
      } else {
        // Refresh current user data
        fetchCurrentUser();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

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
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Update your profile information. Changes are saved to the database in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Profile Image */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profileImagePreview || undefined} />
                      <AvatarFallback className="text-2xl">{name[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                      onClick={() => profileImageRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <input
                      ref={profileImageRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfileImageChange}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Click the camera icon to upload a new picture</p>
                    <p>Maximum file size: 5MB</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  placeholder="Your name"
                  required
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <div className="relative">
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    maxLength={20}
                    placeholder="username"
                    required
                    className={`pr-10 ${
                      usernameAvailable === true
                        ? "border-green-500 focus-visible:ring-green-500"
                        : usernameAvailable === false
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingUsername && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                
                {usernameAvailable === true && username !== originalUsername && (
                  <p className="text-xs text-green-600 dark:text-green-500">
                    ✓ Username is available
                  </p>
                )}
                
                {usernameAvailable === false && (
                  <div className="space-y-2">
                    <p className="text-xs text-red-600 dark:text-red-500">
                      ✗ Username is already taken
                    </p>
                    {usernameSuggestions.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Suggestions:</p>
                        <div className="flex flex-wrap gap-2">
                          {usernameSuggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => setUsername(suggestion)}
                              className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Only lowercase letters, numbers, and underscores. Minimum 3 characters.
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  rows={3}
                  placeholder="Tell us about yourself"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {bio.length}/160
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
