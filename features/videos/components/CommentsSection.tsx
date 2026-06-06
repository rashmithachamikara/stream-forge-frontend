'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/shared/lib/api';
import { Comment } from '@/features/videos/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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

export function CommentsSection({
  videoId,
  currentUserId,
}: {
  videoId: string;
  currentUserId?: string;
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

    return (
      <div
        key={comment.id}
        className={`space-y-3 rounded-lg border bg-card p-4 ${isReply ? 'ml-6 border-dashed' : ''}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{comment.userName}</p>
              <span className="text-xs text-muted-foreground">{comment.createdAt.toLocaleString()}</span>
              {comment.isEdited && <span className="text-xs text-muted-foreground">(edited)</span>}
            </div>
            {editingCommentId === comment.id ? (
              <div className="space-y-2">
                <Textarea value={editingDraft} onChange={(event) => setEditingDraft(event.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void handleUpdateComment(comment.id)} disabled={isSubmitting}>
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditingDraft('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground">{comment.comment}</p>
            )}
          </div>

          {isOwner && editingCommentId !== comment.id && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setEditingCommentId(comment.id);
                  setEditingDraft(comment.comment);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => void handleDeleteCommentItem(comment)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {!isReply && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
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
              >
                <Reply className="h-4 w-4" />
                Reply
              </Button>
              {displayedReplyCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
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
                >
                  {replies?.isOpen ? 'Hide replies' : `Show replies (${displayedReplyCount})`}
                </Button>
              )}
            </div>

            {activeReplyFor === comment.id && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyDrafts[comment.id] ?? ''}
                  onChange={(event) =>
                    setReplyDrafts((current) => ({ ...current, [comment.id]: event.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => void handleCreateComment(replyDrafts[comment.id] ?? '', comment.id)}
                    disabled={isSubmitting}
                  >
                    Reply
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActiveReplyFor(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {replies?.isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading replies...
              </div>
            )}

            {replies?.isOpen && replies.items.length > 0 && (
              <div className="space-y-3">
                {replies.items.map((reply) => renderComment(reply, true))}
                {replies.hasNextPage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadReplies(comment.id, replies.page + 1)}
                  >
                    Load more replies
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
        </CardTitle>
        <CardDescription>Join the conversation around this video.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={() => void handleCreateComment(newComment)} disabled={isSubmitting}>
              Post comment
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading comments...
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => renderComment(comment))}
            <div className="flex items-center justify-between border-t pt-4">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage <= 1}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No comments yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
