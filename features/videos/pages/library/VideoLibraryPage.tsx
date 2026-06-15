'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { PortalEmptyState, PortalPage } from '@/shared/components/portal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Eye, Plus, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/shared/lib/api';
import { Category, TagSummary, Video } from '@/features/videos/types';
import { formatDuration } from '@/features/videos/utils';

export default function VideoLibrary() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
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
  const pageSize = 12;

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

    void loadFilters();

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
        visibility: 'Public',
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

    void loadVideos();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearchTerm, selectedCategoryId, selectedTagId, currentPage, pageSize]);

  const goToVideo = (videoId: string) => {
    router.push(`/videos/${videoId}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedCategoryId(null);
    setSelectedTagId(null);
    setCurrentPage(1);
  };

  const VideoCardGrid = ({ video }: { video: Video }) => (
    <Card
      className="h-full cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
      onClick={() => goToVideo(video.id)}
    >
      <div className="group relative aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
        <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
          <Play className="h-12 w-12 text-white opacity-0 drop-shadow-lg transition-all group-hover:scale-110 group-hover:opacity-90" />
        </div>
        <Badge className="absolute right-3 top-3 bg-black/78 text-white">{formatDuration(video.duration)}</Badge>
      </div>
      <CardContent className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 line-clamp-2 font-semibold">{video.title}</h3>
        <p className="mb-3 line-clamp-2 flex-1 text-xs text-muted-foreground">{video.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {video.views}
          </span>
          <span>{video.uploadedAt.toLocaleDateString()}</span>
        </div>
        <Button
          className="mt-4 w-full gap-2"
          variant="outline"
          onClick={(event) => {
            event.stopPropagation();
            goToVideo(video.id);
          }}
        >
          <Play className="h-4 w-4" />
          Watch
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Video Library">
      <PortalPage>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">Video Library</h1>
            <p className="text-sm text-muted-foreground">{totalCount} published videos</p>
          </div>
          <Button className="gap-2" onClick={() => (window.location.href = '/videos/upload')}>
            <Plus className="h-4 w-4" />
            Upload video
          </Button>
        </div>

        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search videos"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:w-auto">
                <Select
                  value={selectedCategoryId ?? 'all'}
                  onValueChange={(value) => {
                    setSelectedCategoryId(value === 'all' ? null : value);
                    setCurrentPage(1);
                  }}
                  disabled={isFilterLoading}
                >
                  <SelectTrigger className="w-full min-w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedTagId ?? 'all'}
                  onValueChange={(value) => {
                    setSelectedTagId(value === 'all' ? null : value);
                    setCurrentPage(1);
                  }}
                  disabled={isFilterLoading}
                >
                  <SelectTrigger className="w-full min-w-[180px]">
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tags</SelectItem>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearFilters} className="w-full bg-transparent">
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <Card className="py-12 text-center">
            <CardContent>
              <p className="text-muted-foreground">Loading videos...</p>
            </CardContent>
          </Card>
        ) : videos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map((video) => <VideoCardGrid key={video.id} video={video} />)}
            </div>

            <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {videos.length} of {totalCount} videos
              </p>
              {totalPages > 1 ? (
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={!hasPreviousPage}>
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(page)}>
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button variant="outline" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={!hasNextPage}>
                    Next
                  </Button>
                </div>
              ) : (
                <div />
              )}
            </div>
          </>
        ) : (
          <PortalEmptyState
            title="No videos match the current filters"
            description="Clear one or more filters to widen the library view and surface additional published content."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        )}
      </PortalPage>
    </DashboardLayout>
  );
}
