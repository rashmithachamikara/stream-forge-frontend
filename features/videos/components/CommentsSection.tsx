'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/shared/lib/api';
import { Comment } from '@/features/videos/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare, Pencil, Reply, Trash2 } from 'lucide-react';

type ReplyState = Record<
  string,
  {
    isLoading: boolean;
    isOpen: boolean;
    items: Comment[];
    hasNextPage: boolean;
    page: number;
  }
>;

const getRelativeTimeString = (dateInput: Date | string) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return String(dateInput);
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export function CommentsSection({
  videoId,
  currentUserId,
  title,
  showCard = true,
  showDescription = true,
}: {
  videoId: string;
  currentUserId?: string;
  title?: string;
  showCard?: boolean;
  showDescription?: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyState, setReplyState] = useState<ReplyState>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeReplyFor, setActiveReplyFor] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadComments = async () => {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getComments(videoId, {
        page: currentPage,
        pageSize: 10,
      });

      if (!isMounted) {
        return;
      }

      if (response.success && response.data) {
        setComments(response.data.items);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setComments([]);
        setTotalPages(1);
        setError(response.error ?? 'Failed to load comments');
      }

      setIsLoading(false);
    };

    void loadComments();

    return () => {
      isMounted = false;
    };
  }, [currentPage, videoId]);

  const loadReplies = async (parentCommentId: string, nextPage = 1) => {
    setReplyState((current) => ({
      ...current,
      [parentCommentId]: {
        isLoading: true,
        isOpen: true,
        items: current[parentCommentId]?.items ?? [],
        hasNextPage: current[parentCommentId]?.hasNextPage ?? false,
        page: current[parentCommentId]?.page ?? 1,
      },
    }));

    const response = await apiClient.getComments(videoId, {
      parentCommentId,
      page: nextPage,
      pageSize: 10,
    });

    if (response.success && response.data) {
      const repliesPage = response.data;

      setReplyState((current) => ({
        ...current,
        [parentCommentId]: {
          isLoading: false,
          isOpen: true,
          items:
            nextPage === 1
              ? repliesPage.items
              : [...(current[parentCommentId]?.items ?? []), ...repliesPage.items],
          hasNextPage: repliesPage.hasNextPage,
          page: repliesPage.page,
        },
      }));
    } else {
      setReplyState((current) => ({
        ...current,
        [parentCommentId]: {
          isLoading: false,
          isOpen: true,
          items: current[parentCommentId]?.items ?? [],
          hasNextPage: false,
          page: current[parentCommentId]?.page ?? 1,
        },
      }));
      setError(response.error ?? 'Failed to load replies');
    }
  };

  const handleCreateComment = async (comment: string, parentCommentId?: string) => {
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await apiClient.createComment(videoId, {
      comment: trimmedComment,
      parentCommentId: parentCommentId ?? null,
    });

    if (response.success && response.data) {
      const createdComment = response.data;

      if (parentCommentId) {
        setReplyDrafts((current) => ({ ...current, [parentCommentId]: '' }));
        setActiveReplyFor(null);
        setComments((current) =>
          current.map((item) =>
            item.id === parentCommentId ? { ...item, replyCount: item.replyCount + 1 } : item
          )
        );
        setReplyState((current) => {
          const existingReplies = current[parentCommentId];
          if (!existingReplies) {
            return current;
          }

          return {
            ...current,
            [parentCommentId]: {
              ...existingReplies,
              isOpen: true,
              items: [createdComment, ...existingReplies.items],
            },
          };
        });
      } else {
        setNewComment('');
        setComments((current) => [createdComment, ...current]);
      }
    } else {
      setError(response.error ?? 'Failed to create comment');
    }

    setIsSubmitting(false);
  };

  const handleUpdateComment = async (commentId: string) => {
    const trimmedComment = editingDraft.trim();
    if (!trimmedComment) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await apiClient.updateComment(videoId, commentId, {
      comment: trimmedComment,
    });

    if (response.success && response.data) {
      const updatedComment = response.data;
      setComments((current) => current.map((item) => (item.id === commentId ? updatedComment : item)));
      setReplyState((current) => {
        const nextState = { ...current };

        Object.keys(nextState).forEach((parentId) => {
          nextState[parentId] = {
            ...nextState[parentId],
            items: nextState[parentId].items.map((item) => (item.id === commentId ? updatedComment : item)),
          };
        });

        return nextState;
      });
      setEditingCommentId(null);
      setEditingDraft('');
    } else {
      setError(response.error ?? 'Failed to update comment');
    }

    setIsSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) {
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await apiClient.deleteComment(videoId, commentId);

    if (response.success) {
      setComments((current) => current.filter((item) => item.id !== commentId));
      setReplyState((current) => {
        const nextState = { ...current };

        Object.keys(nextState).forEach((parentId) => {
          nextState[parentId] = {
            ...nextState[parentId],
            items: nextState[parentId].items.filter((item) => item.id !== commentId),
          };
        });

        return nextState;
      });
      setIsSubmitting(false);
      return true;
    } else {
      setError(response.error ?? 'Failed to delete comment');
    }

    setIsSubmitting(false);
    return false;
  };

  const handleDeleteCommentItem = async (comment: Comment) => {
    const wasDeleted = await handleDeleteComment(comment.id);

    if (wasDeleted && comment.parentCommentId) {
      setComments((current) =>
        current.map((item) =>
          item.id === comment.parentCommentId
            ? { ...item, replyCount: Math.max(0, item.replyCount - 1) }
            : item
        )
      );
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = Boolean(currentUserId && comment.userId === currentUserId);
    const replies = replyState[comment.id];
    const displayedReplyCount = Math.max(comment.replyCount, replies?.items.length ?? 0);
    const relativeTime = getRelativeTimeString(comment.createdAt);

    return (
      <div key={comment.id} className="flex gap-3 text-left">
        {/* Avatar */}
        <div className={`rounded-full bg-muted ring-1 ring-border grid place-items-center font-semibold shrink-0 select-none text-muted-foreground ${isReply ? 'size-7 text-[9px]' : 'size-8 text-[10px]'}`}>
          {comment.userName ? comment.userName[0].toUpperCase() : '?'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs">
                <span className="font-semibold text-foreground">{comment.userName}</span>{' '}
                <span className="text-muted-foreground">· {relativeTime}</span>
                {comment.isEdited && <span className="text-[10px] text-muted-foreground ml-1">(edited)</span>}
              </p>

              {editingCommentId === comment.id ? (
                <div className="space-y-2 mt-2">
                  <textarea
                    value={editingDraft}
                    onChange={(event) => setEditingDraft(event.target.value)}
                    className="w-full bg-card border border-border rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none text-foreground"
                    rows={2}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => void handleUpdateComment(comment.id)}
                      disabled={isSubmitting}
                      className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditingDraft('');
                      }}
                      className="text-xs px-3 py-1.5 rounded-md hover:bg-accent border border-border cursor-pointer text-foreground bg-transparent"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap leading-relaxed">{comment.comment}</p>
              )}
            </div>

            {isOwner && editingCommentId !== comment.id && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setEditingCommentId(comment.id);
                    setEditingDraft(comment.comment);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => void handleDeleteCommentItem(comment)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {!isReply && (
            <div className="mt-2 space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveReplyFor((current) => (current === comment.id ? null : comment.id));
                    if (!replies) {
                      void loadReplies(comment.id);
                    } else {
                      setReplyState((current) => ({
                        ...current,
                        [comment.id]: { ...replies, isOpen: true },
                      }));
                    }
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors cursor-pointer bg-transparent border-0"
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </button>
                {displayedReplyCount > 0 && (
                  <button
                    onClick={() => {
                      if (!replies || (!replies.isOpen && replies.items.length === 0)) {
                        void loadReplies(comment.id);
                        return;
                      }

                      setReplyState((current) => ({
                        ...current,
                        [comment.id]: { ...replies, isOpen: !replies.isOpen },
                      }));
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent transition-colors cursor-pointer bg-transparent border-0"
                  >
                    {replies?.isOpen ? 'Hide replies' : `Show replies (${displayedReplyCount})`}
                  </button>
                )}
              </div>

              {activeReplyFor === comment.id && (
                <div className="flex gap-3 mt-3">
                  <div className="size-7 rounded-full bg-muted ring-1 ring-border grid place-items-center font-semibold text-[9px] text-muted-foreground shrink-0 select-none">
                    {currentUserId ? 'U' : '?'}
                  </div>
                  <div className="flex-1">
                    <textarea
                      placeholder="Write a reply..."
                      value={replyDrafts[comment.id] ?? ''}
                      onChange={(event) =>
                        setReplyDrafts((current) => ({ ...current, [comment.id]: event.target.value }))
                      }
                      className="w-full bg-card border border-border rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none text-foreground"
                      rows={2}
                    />
                    <div className="flex gap-2 justify-end mt-2">
                      <button
                        onClick={() => void handleCreateComment(replyDrafts[comment.id] ?? '', comment.id)}
                        disabled={isSubmitting || !(replyDrafts[comment.id] ?? '').trim()}
                        className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => setActiveReplyFor(null)}
                        className="text-xs px-3 py-1.5 rounded-md hover:bg-accent border border-border cursor-pointer text-foreground bg-transparent"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {replies?.isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-4">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading replies...
                </div>
              )}

              {replies?.isOpen && replies.items.length > 0 && (
                <div className="space-y-4 pl-4 border-l border-border ml-4 mt-4">
                  {replies.items.map((reply) => renderComment(reply, true))}
                  {replies.hasNextPage && (
                    <button
                      onClick={() => void loadReplies(comment.id, replies.page + 1)}
                      className="text-xs text-primary hover:underline font-medium cursor-pointer bg-transparent border-0"
                    >
                      Load more replies
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const headerTitle = title ?? `${comments.length} comments`;

  const content = (
    <div className="space-y-5">
      <div className="flex gap-3">
        <div className="size-8 rounded-full bg-muted ring-1 ring-border grid place-items-center font-semibold text-[10px] text-muted-foreground shrink-0 select-none">
          {currentUserId ? 'U' : '?'}
        </div>
        <div className="flex-1">
          <textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            className="w-full bg-card border border-border rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none text-foreground"
            rows={2}
          />
          {newComment.trim() && (
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => setNewComment('')}
                className="text-xs px-3 py-1.5 rounded-md hover:bg-accent border border-border cursor-pointer text-foreground bg-transparent"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreateComment(newComment)}
                disabled={isSubmitting}
                className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                Comment
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading comments...
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => renderComment(comment))}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage <= 1}
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-50 cursor-pointer text-foreground bg-transparent"
            >
              Previous
            </button>
            <span className="text-xs text-muted-foreground font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage >= totalPages}
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-50 cursor-pointer text-foreground bg-transparent"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">No comments yet.</p>
      )}
    </div>
  );

  if (!showCard) {
    return (
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">{headerTitle}</h2>
        {content}
      </section>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {headerTitle}
        </CardTitle>
        {showDescription ? <CardDescription>Join the conversation around this video.</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{content}</CardContent>
    </Card>
  );
}
