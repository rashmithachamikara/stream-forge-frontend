'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { apiClient } from '@/shared/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Search, Loader2, Bookmark as BookmarkIcon } from 'lucide-react';
import { Bookmark } from '@/features/bookmarks/types';
import { Category } from '@/features/videos/types';
import { AuthenticatedThumbnail } from '@/shared/components/AuthenticatedThumbnail';

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

const relTime = (dateInput: Date | string) => {
  const d = (Date.now() - new Date(dateInput).getTime()) / 1000;
  if (d < 60) return 'Just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};

const getBookmarkTitle = (bookmark: Bookmark) => bookmark.note || `Bookmark at ${formatTime(bookmark.timestampSeconds)}`;

interface VideoGroup {
  videoId: string;
  video: Bookmark['video'];
  bookmarks: Bookmark[];
}

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      const [bookmarksRes, categoriesRes] = await Promise.all([
        apiClient.getMyBookmarks({ page: 1, pageSize: 50 }),
        apiClient.getCategories(),
      ]);

      if (!isMounted) {
        return;
      }

      if (bookmarksRes.success && bookmarksRes.data) {
        setBookmarks(bookmarksRes.data.items);
      } else {
        setBookmarks([]);
        setError(bookmarksRes.error ?? 'Failed to load bookmarks');
      }

      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      } else {
        setCategories([]);
      }

      setIsLoading(false);
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleteBookmark = async (bookmark: Bookmark) => {
    const response = await apiClient.deleteBookmark(bookmark.videoId, bookmark.id);

    if (response.success) {
      setBookmarks((current) => current.filter((item) => item.id !== bookmark.id));
      toast.success('Bookmark deleted successfully');
    } else {
      toast.error(response.error ?? 'Failed to delete bookmark');
    }
  };

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bookmark) => {
      const title = getBookmarkTitle(bookmark).toLowerCase();
      const videoTitle = bookmark.video?.title?.toLowerCase() ?? '';
      const query = searchTerm.toLowerCase();

      // Search matching
      const matchesSearch = title.includes(query) || videoTitle.includes(query);
      if (!matchesSearch) return false;

      // Category matching
      if (selectedCategoryId === 'all') return true;
      if (selectedCategoryId === 'uncategorized') {
        return !bookmark.video?.categoryId;
      }
      return bookmark.video?.categoryId === selectedCategoryId;
    });
  }, [bookmarks, searchTerm, selectedCategoryId]);

  const videoGroups = useMemo(() => {
    const groupsMap = new Map<string, VideoGroup>();

    filteredBookmarks.forEach((b) => {
      const videoId = b.videoId;
      if (!groupsMap.has(videoId)) {
        groupsMap.set(videoId, {
          videoId,
          video: b.video,
          bookmarks: [],
        });
      }
      groupsMap.get(videoId)!.bookmarks.push(b);
    });

    // Sort bookmarks inside each group by timestampSeconds (chronological playback time)
    groupsMap.forEach((group) => {
      group.bookmarks.sort((a, b) => a.timestampSeconds - b.timestampSeconds);
    });

    // Sort video groups by the latest bookmark's updatedAt/createdAt
    return Array.from(groupsMap.values()).sort((a, b) => {
      const latestA = Math.max(...a.bookmarks.map((x) => new Date(x.updatedAt || x.createdAt).getTime()));
      const latestB = Math.max(...b.bookmarks.map((x) => new Date(x.updatedAt || x.createdAt).getTime()));
      return latestB - latestA;
    });
  }, [filteredBookmarks]);

  // Auto-select the first video group if selection is empty/invalid
  useEffect(() => {
    if (videoGroups.length > 0) {
      const isValid = videoGroups.some((g) => g.videoId === selectedVideoId);
      if (!isValid) {
        queueMicrotask(() => {
          setSelectedVideoId(videoGroups[0].videoId);
        });
      }
    } else {
      if (selectedVideoId !== null) {
        queueMicrotask(() => {
          setSelectedVideoId(null);
        });
      }
    }
  }, [videoGroups, selectedVideoId]);

  const activeGroup = useMemo(() => {
    return videoGroups.find((g) => g.videoId === selectedVideoId) || null;
  }, [videoGroups, selectedVideoId]);

  const activeVideoCategory = useMemo(() => {
    if (!activeGroup?.video?.categoryId) return null;
    return categories.find((c) => c.id === activeGroup.video!.categoryId) || null;
  }, [activeGroup, categories]);

  return (
    <DashboardLayout title="My Bookmarks">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-border pb-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Saved timestamps</p>
            <h1 className="text-2xl font-bold tracking-tight mt-1 text-foreground">Bookmarks</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[16rem] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full bg-card border border-border rounded-md py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Category Dropdown */}
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger className="h-8 w-44 text-xs bg-card border-border text-foreground">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All categories</SelectItem>
              <SelectItem value="uncategorized" className="text-xs">Uncategorized</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-xs">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-xs">Loading bookmarks...</p>
          </div>
        ) : videoGroups.length > 0 && selectedVideoId ? (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
            {/* Left Column - Videos List */}
            <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {videoGroups.map((group) => {
                const isActive = group.videoId === selectedVideoId;
                return (
                  <div
                    key={group.videoId}
                    onClick={() => setSelectedVideoId(group.videoId)}
                    className={`flex gap-3 p-2.5 rounded-lg border cursor-pointer select-none transition-all duration-200 ${
                      isActive
                        ? 'bg-accent/60 border-primary ring-1 ring-primary/20'
                        : 'bg-card border-border hover:bg-muted/30 hover:border-border-muted'
                    }`}
                  >
                    <div className="w-16 aspect-video shrink-0 overflow-hidden rounded border border-border relative bg-black">
                      <AuthenticatedThumbnail
                        src={group.video?.thumbnail}
                        alt={group.video?.title ?? 'Video thumbnail'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <h3 
                        title={group.video?.title ?? 'Unknown Video'}
                        className="text-xs font-semibold text-foreground leading-tight truncate"
                      >
                        {group.video?.title ?? 'Unknown Video'}
                      </h3>
                      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mt-1">
                        {group.bookmarks.length} {group.bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column - Selected Video Bookmarks Detail */}
            {activeGroup && (
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[400px]">
                {/* Header */}
                <div className="p-5 border-b border-border bg-muted/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        Selected Video
                      </span>
                      <span className="text-muted-foreground text-[10px] font-mono">•</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {activeVideoCategory ? activeVideoCategory.name : 'Uncategorized'}
                      </span>
                    </div>
                    <h2
                      onClick={() => router.push(`/videos/${activeGroup.videoId}`)}
                      className="text-base font-bold mt-1 text-foreground hover:text-primary transition-colors cursor-pointer hover:underline truncate"
                    >
                      {activeGroup.video?.title ?? 'Unknown Video'}
                    </h2>
                    <p className="text-[9px] text-muted-foreground font-mono mt-1 uppercase tracking-wider">
                      Uploaded by {activeGroup.video?.uploadedBy ?? 'Unknown'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/videos/${activeGroup.videoId}`)}
                    className="text-xs shrink-0 h-8 font-semibold"
                  >
                    Watch video
                  </Button>
                </div>

                {/* Bookmarks List */}
                <div className="divide-y divide-border flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
                  {activeGroup.bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      onClick={() => router.push(`/videos/${bookmark.videoId}?t=${bookmark.timestampSeconds}`)}
                      className="flex items-center justify-between py-3 px-5 gap-4 hover:bg-muted/10 transition-colors group/item cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground leading-snug group-hover/item:text-primary transition-colors">
                          {getBookmarkTitle(bookmark)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          Saved {relTime(bookmark.updatedAt || bookmark.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className="inline-flex items-center justify-center text-[10px] font-mono text-primary bg-primary/10 px-2.5 py-1 rounded font-semibold tabular-nums"
                        >
                          {formatTime(bookmark.timestampSeconds)}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteBookmark(bookmark);
                          }}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0 cursor-pointer sm:opacity-0 sm:group-hover/item:opacity-100"
                          title="Delete bookmark"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 border border-border bg-card rounded-xl">
            <div className="size-12 mx-auto bg-muted rounded-full grid place-items-center mb-4">
              <BookmarkIcon className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">
              {searchTerm || selectedCategoryId !== 'all' ? 'No bookmarks found' : 'No bookmarks yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchTerm || selectedCategoryId !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Bookmarks you create on videos will appear here.'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
