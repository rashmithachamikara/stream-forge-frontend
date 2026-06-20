'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Grid3x3, List, Search, X, Plus, VideoOff, SearchSlash } from 'lucide-react';
import { apiClient } from '@/shared/lib/api';
import { Category, TagSummary, Video } from '@/features/videos/types';
import { VideoCard } from '@/features/videos/components/VideoCard';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/features/auth/AuthContext';

const formatPlaybackDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-accent rounded-full px-2 py-0.5 text-[11px] text-accent-foreground">
      {label}
      <button onClick={onClear} className="hover:text-foreground">
        <X className="size-3" />
      </button>
    </span>
  );
}

export default function VideoLibrary() {
  const router = useRouter();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [uploaderFilter, setUploaderFilter] = useState<'all' | 'me' | 'others'>('all');
  const [selectedVisibility, setSelectedVisibility] = useState<'All' | 'Public' | 'Private' | 'Internal'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = viewMode === 'grid' ? 12 : 10;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;

    const loadFilters = async () => {
      setIsFilterLoading(true);
      const [categoryResponse, tagResponse] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getTags(undefined, 1, 50),
      ]);

      if (!isMounted) {
        return;
      }

      if (categoryResponse.success && categoryResponse.data) {
        setCategories(categoryResponse.data);
      }

      if (tagResponse.success && tagResponse.data) {
        setTags(tagResponse.data.items);
      }

      setIsFilterLoading(false);
    };

    loadFilters();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadVideos = async () => {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getVideos({
        search: debouncedSearchTerm || undefined,
        categoryId: selectedCategoryId ?? undefined,
        tagId: selectedTagId ?? undefined,
        status: 'Ready',
        visibility: selectedVisibility !== 'All' ? selectedVisibility : undefined,
        uploaderId: uploaderFilter === 'me' && user ? user.id : undefined,
        excludeUploaderId: uploaderFilter === 'others' && user ? user.id : undefined,
        page: currentPage,
        pageSize,
      });

      if (!isMounted) {
        return;
      }

      if (response.success && response.data) {
        setVideos(response.data.items);
        setTotalCount(response.data.totalCount);
        setTotalPages(response.data.totalPages);
        setHasNextPage(response.data.hasNextPage);
        setHasPreviousPage(response.data.hasPreviousPage);
      } else {
        setVideos([]);
        setTotalCount(0);
        setTotalPages(0);
        setHasNextPage(false);
        setHasPreviousPage(false);
        setError(response.error ?? 'Failed to load videos');
      }

      setIsLoading(false);
    };

    loadVideos();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearchTerm, selectedCategoryId, selectedTagId, uploaderFilter, selectedVisibility, user, currentPage, pageSize]);

  const goToVideo = (videoId: string) => {
    router.push(`/videos/${videoId}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedCategoryId(null);
    setSelectedTagId(null);
    setUploaderFilter('all');
    setSelectedVisibility('All');
    setCurrentPage(1);
  };

  return (
    <DashboardLayout title="Video Library">
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4 text-left">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Library</p>
            <h1 className="text-2xl font-bold tracking-tight mt-1">All videos</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/videos/upload')}
              className="inline-flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 rounded-md text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="size-3.5" /> New video
            </button>
            <div className="flex items-center bg-muted rounded-md p-0.5">
              <button
                onClick={() => {
                  setViewMode('grid');
                  setCurrentPage(1);
                }}
                className={cn("p-1.5 rounded", viewMode === 'grid' && "bg-background shadow-sm")}
              >
                <Grid3x3 className="size-3.5" />
              </button>
              <button
                onClick={() => {
                  setViewMode('list');
                  setCurrentPage(1);
                }}
                className={cn("p-1.5 rounded", viewMode === 'list' && "bg-background shadow-sm")}
              >
                <List className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          <aside className="space-y-6 text-left">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search title or description"
                className="w-full bg-card border border-border rounded-md pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {user && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Source</p>
                <div className="flex bg-muted rounded-md p-0.5 w-full">
                  <button
                    onClick={() => {
                      setUploaderFilter('all');
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "flex-1 text-center text-[11px] py-1 rounded transition-colors font-medium cursor-pointer",
                      uploaderFilter === 'all'
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      setUploaderFilter('me');
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "flex-1 text-center text-[11px] py-1 rounded transition-colors font-medium cursor-pointer",
                      uploaderFilter === 'me'
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Me
                  </button>
                  <button
                    onClick={() => {
                      setUploaderFilter('others');
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "flex-1 text-center text-[11px] py-1 rounded transition-colors font-medium cursor-pointer",
                      uploaderFilter === 'others'
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Others
                  </button>
                </div>
              </div>
            )}

            {user && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Visibility</p>
                <div className="flex bg-muted rounded-md p-0.5 w-full">
                  <button
                    onClick={() => {
                      setSelectedVisibility('All');
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "flex-1 text-center text-[10px] py-1 rounded transition-colors font-medium cursor-pointer",
                      selectedVisibility === 'All'
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      setSelectedVisibility('Public');
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "flex-1 text-center text-[10px] py-1 rounded transition-colors font-medium cursor-pointer",
                      selectedVisibility === 'Public'
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Public
                  </button>
                  <button
                    onClick={() => {
                      setSelectedVisibility('Internal');
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "flex-1 text-center text-[10px] py-1 rounded transition-colors font-medium cursor-pointer",
                      selectedVisibility === 'Internal'
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Internal
                  </button>
                  <button
                    onClick={() => {
                      setSelectedVisibility('Private');
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "flex-1 text-center text-[10px] py-1 rounded transition-colors font-medium cursor-pointer",
                      selectedVisibility === 'Private'
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Private
                  </button>
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Categories</p>
              <div className="space-y-0.5">
                <button
                  disabled={isFilterLoading}
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "block w-full text-left text-xs px-2 py-1 rounded transition-colors",
                    selectedCategoryId === null
                      ? "bg-accent font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  All categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategoryId(c.id);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "block w-full text-left text-xs px-2 py-1 rounded transition-colors",
                      selectedCategoryId === c.id
                        ? "bg-accent font-semibold text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 18).map((t) => (
                  <button
                    key={t.id}
                    disabled={isFilterLoading}
                    onClick={() => {
                      setSelectedTagId(selectedTagId === t.id ? null : t.id);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                      selectedTagId === t.id
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/40"
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-6 text-left">
            {(selectedCategoryId || selectedTagId || debouncedSearchTerm || uploaderFilter !== 'all' || selectedVisibility !== 'All') && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Filters:</span>
                {debouncedSearchTerm && (
                  <Chip
                    label={`“${debouncedSearchTerm}”`}
                    onClear={() => {
                      setSearchTerm('');
                      setDebouncedSearchTerm('');
                    }}
                  />
                )}
                {selectedCategoryId && (
                  <Chip
                    label={categories.find((c) => c.id === selectedCategoryId)?.name || ''}
                    onClear={() => setSelectedCategoryId(null)}
                  />
                )}
                {selectedTagId && (
                  <Chip
                    label={`#${tags.find((t) => t.id === selectedTagId)?.name || ''}`}
                    onClear={() => setSelectedTagId(null)}
                  />
                )}
                {uploaderFilter === 'me' && (
                  <Chip
                    label="My videos"
                    onClear={() => setUploaderFilter('all')}
                  />
                )}
                {uploaderFilter === 'others' && (
                  <Chip
                    label="Other creators"
                    onClear={() => setUploaderFilter('all')}
                  />
                )}
                {selectedVisibility !== 'All' && (
                  <Chip
                    label={`Visibility: ${selectedVisibility}`}
                    onClear={() => setSelectedVisibility('All')}
                  />
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {totalCount} {totalCount === 1 ? "result" : "results"}
            </p>

            {error && (
              <div className="border border-destructive/20 bg-destructive/5 rounded-md p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-20 text-sm text-muted-foreground">
                Loading videos...
              </div>
            ) : videos.length > 0 ? (
              <>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {videos.map((video) => (
                      <VideoCard key={video.id} video={video} href={`/videos/${video.id}`} />
                    ))}
                  </div>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden divide-y divide-border bg-card">
                    {videos.map((video) => (
                      <Link
                        key={video.id}
                        href={`/videos/${video.id}`}
                        className="flex items-center gap-4 p-3 hover:bg-accent transition-colors"
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-28 aspect-video object-cover rounded ring-1 ring-border"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate text-foreground hover:text-primary transition-colors">
                            {video.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {video.uploadedBy} · {video.categories[0] || 'Uncategorized'}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {formatPlaybackDuration(video.duration)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
                    <div className="flex gap-1">
                      <button
                        disabled={!hasPreviousPage}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-accent transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        disabled={!hasNextPage}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-accent transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="mb-4 text-muted-foreground/60">
                  <SearchSlash className="size-8 stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight">No videos found</h3>
                <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  We couldn't find any results matching your search terms or filters. Try adjusting your criteria.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-6 text-xs font-semibold px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent text-foreground transition-colors cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
