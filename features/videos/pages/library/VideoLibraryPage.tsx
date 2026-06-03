'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Eye, Filter, Grid, List, Plus } from 'lucide-react';
import { apiClient } from '@/shared/lib/api';
import { Category, TagSummary, Video } from '@/features/videos/types';
import { formatDuration } from '@/features/videos/utils';

export default function VideoLibrary() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

    loadVideos();

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
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full flex flex-col"
      onClick={() => goToVideo(video.id)}
    >
      <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-90 group-hover:scale-110 transition-all drop-shadow-lg" />
        </div>
        <Badge className="absolute top-2 right-2 bg-black/80 text-white">
          {formatDuration(video.duration)}
        </Badge>
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold line-clamp-2 mb-2">{video.title}</h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">
          {video.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {video.views}
          </span>
          <span>{video.uploadedAt.toLocaleDateString()}</span>
        </div>
        <Button
          className="w-full mt-4 gap-2"
          variant="outline"
          onClick={(event) => {
            event.stopPropagation();
            goToVideo(video.id);
          }}
        >
          <Play className="w-4 h-4" />
          Watch
        </Button>
      </CardContent>
    </Card>
  );

  const VideoCardList = ({ video }: { video: Video }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => goToVideo(video.id)}>
      <CardContent className="p-6 flex items-start gap-6">
        <div className="relative w-40 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-8 h-8 text-white opacity-70 drop-shadow-lg" />
          </div>
          <Badge className="absolute top-1 right-1 bg-black/80 text-white text-xs">
            {formatDuration(video.duration)}
          </Badge>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">{video.title}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {video.description}
          </p>
          <div className="flex flex-wrap gap-1 mb-4">
            {video.categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {video.views} views
            </span>
            <span>{video.uploadedAt.toLocaleDateString()}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                goToVideo(video.id);
              }}
            >
              <Play className="w-3 h-3 mr-1" />
              Watch
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Video Library">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Video Library</h1>
            <p className="text-muted-foreground">Browse and watch videos</p>
          </div>
          <Button 
            className="gap-2 gradient-primary text-white font-medium"
            onClick={() => window.location.href = '/videos/upload'}
          >
            <Plus className="w-4 h-4" />
            New Video
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search videos by title or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategoryId === null ? 'default' : 'outline'}
                    size="sm"
                    disabled={isFilterLoading}
                    onClick={() => setSelectedCategoryId(null)}
                  >
                    All
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategoryId === category.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        setCurrentPage(1);
                      }}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedTagId === null ? 'default' : 'outline'}
                    size="sm"
                    disabled={isFilterLoading}
                    onClick={() => setSelectedTagId(null)}
                  >
                    All
                  </Button>
                  {tags.map((tag) => (
                    <Button
                      key={tag.id}
                      variant={selectedTagId === tag.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedTagId(tag.id);
                        setCurrentPage(1);
                      }}
                    >
                      {tag.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {videos.length} of {totalCount} videos
          </p>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => {
                setViewMode('grid');
                setCurrentPage(1);
              }}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => {
                setViewMode('list');
                setCurrentPage(1);
              }}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Videos */}
        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">Loading videos...</p>
            </CardContent>
          </Card>
        ) : videos.length > 0 ? (
          <>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'space-y-4'
              }
            >
              {videos.map((video) =>
                viewMode === 'grid' ? (
                  <VideoCardGrid key={video.id} video={video} />
                ) : (
                  <VideoCardList key={video.id} video={video} />
                )
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={!hasPreviousPage}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={!hasNextPage}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">No videos found matching your criteria</p>
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
