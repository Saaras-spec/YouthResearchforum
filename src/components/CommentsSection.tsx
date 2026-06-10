"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getComments, addComment, deleteComment, Comment } from "@/lib/db";
import { MessageSquare, Trash2, Send, ShieldAlert, User } from "lucide-react";
import Image from "next/image";

interface CommentsSectionProps {
  articleId: string;
}

export default function CommentsSection({ articleId }: CommentsSectionProps) {
  const { user, role } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load comments
  const loadComments = async () => {
    setIsLoading(true);
    try {
      const data = await getComments(articleId);
      setComments(data);
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [articleId]);

  // Handle post comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment({
        articleId,
        userId: user.uid,
        userName: user.displayName || "Reader",
        userPhotoURL: user.photoURL || "",
        text: commentText.trim(),
      });
      setCommentText("");
      // Reload comments
      await loadComments();
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete comment (Admin function)
  const handleDelete = async (commentId: string) => {
    if (role !== "admin") return;
    if (confirm("Are you sure you want to delete this comment? This action is irreversible.")) {
      try {
        await deleteComment(commentId);
        // Remove from UI state
        setComments(comments.filter((c) => c.id !== commentId));
      } catch (error) {
        console.error("Failed to delete comment:", error);
      }
    }
  };

  // Date formatter
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="border-t border-[#e6e2da] pt-10 mt-12 font-sans">
      <h3 className="font-serif text-2xl font-bold text-editorial-charcoal mb-8 flex items-center">
        <MessageSquare className="h-5.5 w-5.5 mr-2 text-editorial-accent" />
        Discussion ({comments.length})
      </h3>

      {/* Write Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-10 space-y-4">
          <div className="flex gap-4">
            <div className="relative h-10 w-10 flex-shrink-0 bg-editorial-cream-dark border border-[#e6e2da] rounded-full overflow-hidden flex items-center justify-center">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || "Avatar"}
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-editorial-gray" />
              )}
            </div>

            <div className="flex-1">
              <textarea
                rows={3}
                placeholder="Participate in the discourse. Please keep comments intellectual, respectful, and constructive..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-white border border-[#e6e2da] p-3 text-sm outline-none text-editorial-charcoal placeholder-editorial-gray/50 focus:border-editorial-accent transition-colors rounded-sm resize-y"
                required
                disabled={isSubmitting}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                  className="inline-flex items-center bg-editorial-charcoal hover:bg-editorial-accent text-white uppercase text-xs tracking-widest font-bold px-4 py-2 rounded-sm transition-all cursor-pointer disabled:opacity-40"
                >
                  {isSubmitting ? "Posting..." : "Post Comment"}
                  <Send className="h-3 w-3 ml-1.5" />
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-6 bg-editorial-cream-dark/20 border border-[#e6e2da] rounded-sm text-center mb-10">
          <p className="text-sm text-editorial-gray">
            Only registered readers can participate in discussions.
          </p>
          <div className="mt-3">
            <Link
              href="/login"
              className="inline-block text-xs font-mono uppercase tracking-widest text-white bg-editorial-charcoal hover:bg-editorial-accent px-4 py-2 rounded-sm font-bold transition-all"
            >
              Sign In to Comment
            </Link>
          </div>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-16 bg-editorial-cream-dark/20 animate-pulse rounded-sm" />
          <div className="h-16 bg-editorial-cream-dark/20 animate-pulse rounded-sm" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-editorial-gray italic text-center py-6">
          No comments yet. Start the conversation.
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="group flex gap-4 p-4 border border-[#e6e2da] bg-white rounded-sm hover:shadow-xs transition-shadow">
              {/* User Avatar */}
              <div className="relative h-10 w-10 flex-shrink-0 bg-editorial-cream-dark border border-[#e6e2da] rounded-full overflow-hidden flex items-center justify-center">
                {comment.userPhotoURL ? (
                  <Image
                    src={comment.userPhotoURL}
                    alt={comment.userName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-editorial-gray" />
                )}
              </div>

              {/* Comment Content */}
              <div className="flex-grow">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-editorial-charcoal">
                      {comment.userName}
                    </span>
                    <span className="text-[10px] text-editorial-gray">•</span>
                    <span className="text-[10px] text-editorial-gray font-mono">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>

                  {/* Admin Moderation Button */}
                  {role === "admin" && (
                    <button
                      onClick={() => handleDelete(comment.id!)}
                      className="text-editorial-accent hover:text-red-700 p-1 rounded-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                      title="Moderate/Delete comment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-editorial-charcoal leading-relaxed whitespace-pre-wrap">
                  {comment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
