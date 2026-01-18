'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Eye, Filter, Grid, List, Plus } from 'lucide-react';
import { Video } from '@/types';

export default function VideoLibrary() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = viewMode === 'grid' ? 12 : 10;

  const [videos] = useState<Video[]>([
    {
      id: '1',
      title: 'Getting Started with Stream Forge',
      description: 'Learn the basics of our platform in this comprehensive tutorial.',
      thumbnail: '/placeholder.jpg',
      duration: 600,
      uploadedBy: 'Jane Editor',
      uploadedAt: new Date('2024-02-15'),
      views: 234,
      categories: ['Tutorial', 'Onboarding'],
      tags: ['intro', 'basics', 'getting-started'],
      visibility: 'public',
      hlsUrl: 'https://example.com/hls/video1.m3u8',
      transcodedVersions: [],
    },
    {
      id: '2',
      title: 'Advanced Features Tour',
      description: 'Explore the advanced features and capabilities.',
      thumbnail: '/placeholder.jpg',
      duration: 1200,
      uploadedBy: 'Jane Editor',
      uploadedAt: new Date('2024-02-10'),
      views: 156,
      categories: ['Tutorial'],
      tags: ['advanced', 'features'],
      visibility: 'public',
      hlsUrl: 'https://example.com/hls/video2.m3u8',
      transcodedVersions: [],
    },
    {
      id: '3',
      title: 'Company Training Session',
      description: 'Q1 2024 company-wide training session.',
      thumbnail: '/placeholder.jpg',
      duration: 2400,
      uploadedBy: 'Jane Editor',
      uploadedAt: new Date('2024-02-05'),
      views: 89,
      categories: ['Training'],
      tags: ['company', 'training', 'q1'],
      visibility: 'public',
      hlsUrl: 'https://example.com/hls/video3.m3u8',
      transcodedVersions: [],
    },
    {
      id: '4',
      title: 'Product Demo',
      description: 'See our new features in action.',
      thumbnail: '/placeholder.jpg',
      duration: 900,
      uploadedBy: 'Jane Editor',
      uploadedAt: new Date('2024-01-28'),
      views: 342,
      categories: ['Demo'],
      tags: ['product', 'demo', 'new-features'],
      visibility: 'public',
      hlsUrl: 'https://example.com/hls/video4.m3u8',
      transcodedVersions: [],
    },
  ]);

  // Get all unique categories and tags
  const allCategories = Array.from(
    new Set(videos.flatMap((v) => v.categories))
  );
  const allTags = Array.from(new Set(videos.flatMap((v) => v.tags)));

  // Filter videos
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesSearch =
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        !selectedCategory || video.categories.includes(selectedCategory);

      const matchesTag = !selectedTag || video.tags.includes(selectedTag);

      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [searchTerm, selectedCategory, selectedTag, videos]);

  // Paginate
  const totalPages = Math.ceil(filteredVideos.length / pageSize);
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const VideoCardGrid = ({ video }: { video: Video }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full flex flex-col">
      <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
        <Play className="w-12 h-12 text-primary opacity-40 group-hover:scale-110 transition-transform" />
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
        <Button className="w-full mt-4 gap-2" variant="outline">
          <Play className="w-4 h-4" />
          Watch
        </Button>
      </CardContent>
    </Card>
  );

  const VideoCardList = ({ video }: { video: Video }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-6 flex items-start gap-6">
        <div className="relative w-40 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          <Play className="w-8 h-8 text-primary opacity-40" />
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
            <Button size="sm" variant="outline">
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
          <Button className="gap-2 gradient-primary text-white font-medium">
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
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All
                  </Button>
                  {allCategories.map((cat) => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCurrentPage(1);
                      }}
                    >
                      {cat}
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
                    variant={selectedTag === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTag(null)}
                  >
                    All
                  </Button>
                  {allTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTag === tag ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedTag(tag);
                        setCurrentPage(1);
                      }}
                    >
                      {tag}
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
            Showing {paginatedVideos.length} of {filteredVideos.length} videos
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
        {paginatedVideos.length > 0 ? (
          <>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'space-y-4'
              }
            >
              {paginatedVideos.map((video) =>
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
                  disabled={currentPage === 1}
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
                  disabled={currentPage === totalPages}
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
              <Button variant="outline">Clear Filters</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
