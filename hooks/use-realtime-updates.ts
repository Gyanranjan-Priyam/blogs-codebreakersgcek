"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface UseRealtimeUpdatesProps {
  onNewTweet?: (tweet: any) => void;
  onTweetUpdate?: (tweetId: string, updates: any) => void;
  onTweetDelete?: (tweetId: string) => void;
  onNewComment?: (tweetId: string, comment: any) => void;
  onCommentDelete?: (tweetId: string, commentId: string) => void;
  onLikeUpdate?: (tweetId: string, likes: number, isLiked: boolean) => void;
  onCommentLikeUpdate?: (tweetId: string, commentId: string, likes: number, isLiked: boolean) => void;
}

export function useRealtimeUpdates({
  onNewTweet,
  onTweetUpdate,
  onTweetDelete,
  onNewComment,
  onCommentDelete,
  onLikeUpdate,
  onCommentLikeUpdate,
}: UseRealtimeUpdatesProps) {
  const lastCheckRef = useRef<number>(Date.now());
  const pollingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Poll for updates every 3 seconds
    const pollUpdates = async () => {
      try {
        const response = await fetch(`/api/tweets/updates?since=${lastCheckRef.current}`);
        if (response.ok) {
          const { updates } = await response.json();
          
          updates.forEach((update: any) => {
            switch (update.type) {
              case "NEW_TWEET":
                onNewTweet?.(update.data);
                break;
              case "UPDATE_TWEET":
                onTweetUpdate?.(update.tweetId, update.data);
                break;
              case "DELETE_TWEET":
                onTweetDelete?.(update.tweetId);
                break;
              case "NEW_COMMENT":
                onNewComment?.(update.tweetId, update.data);
                break;
              case "DELETE_COMMENT":
                onCommentDelete?.(update.tweetId, update.commentId);
                break;
              case "LIKE_TWEET":
                onLikeUpdate?.(update.tweetId, update.likes, update.isLiked);
                break;
              case "LIKE_COMMENT":
                onCommentLikeUpdate?.(update.tweetId, update.commentId, update.likes, update.isLiked);
                break;
            }
          });

          lastCheckRef.current = Date.now();
        }
      } catch (error) {
        console.error("Error polling updates:", error);
      }
    };

    pollingIntervalRef.current = setInterval(pollUpdates, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [onNewTweet, onTweetUpdate, onTweetDelete, onNewComment, onCommentDelete, onLikeUpdate, onCommentLikeUpdate]);
}
