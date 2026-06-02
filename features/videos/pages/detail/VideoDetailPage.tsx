'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { VideoPlayer } from '@/features/videos/components/VideoPlayer';
import { mockVideos } from '@/features/videos/data/mockVideos';
import { getVideoManifestUrl, getVideoThumbnailUrl } from '@/features/videos/lib/playbackUrls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Share2, Bookmark, ThumbsUp, MoreVertical, Eye, Calendar, Play } from 'lucide-react';
import { Bookmark as BookmarkType } from '@/features/bookmarks/types';
import { Video } from '@/features/videos/types';

export default function WatchVideoPage({ videoId }: { videoId: string }) {
  const router = useRouter();
  const video = mockVideos.find((mockVideo) => mockVideo.id === videoId) ?? {
    id: videoId,
    title: 'Stream Forge Video',
    description: 'Video metadata is not available yet. Playback uses the requested video ID.',
    thumbnail: getVideoThumbnailUrl(videoId),
    duration: 0,
    uploadedBy: 'Stream Forge',
    uploadedAt: new Date(),
    views: 0,
    categories: [],
    tags: [],
    visibility: 'public',
    hlsUrl: getVideoManifestUrl(videoId),
    transcodedVersions: [],
  } satisfies Video;

  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([
    {
      id: '1',
      videoId: video.id,
      userId: 'user1',
      timestamp: 120,
      title: 'Key concept introduction',
      createdAt: new Date(),
    },
    {
      id: '2',
      videoId: video.id,
      userId: 'user1',
      timestamp: 300,
      title: 'Important feature demo',
      createdAt: new Date(),
    },
  ]);

  const [isLiked, setIsLiked] = useState(false);
  const [transcript, setTranscript] = useState<string>(
    `00:00:00 - Welcome to Stream Forge, a self-hosted video streaming platform.
00:00:10 - In this tutorial, we'll cover the basics of the platform.
00:02:00 - First, let's understand the different user roles: Admin, Editor, and Viewer.
00:05:00 - Admins manage users and view system analytics.
00:10:00 - Editors can upload and manage videos.
00:15:00 - Viewers can browse and watch videos from the library.`
  );

  const handleBookmarkAdd = (timestamp: number) => {
    const newBookmark: BookmarkType = {
      id: String(bookmarks.length + 1),
      videoId: video.id,
      userId: 'current-user',
      timestamp,
      title: `Bookmark at ${formatTime(timestamp)}`,
      createdAt: new Date(),
    };
    setBookmarks([...bookmarks, newBookmark]);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const relatedVideos: Video[] = mockVideos.filter((relatedVideo) => relatedVideo.id !== video.id);

  return (
    <DashboardLayout title="Watch Video">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Video Player */}
        <VideoPlayer
          hlsUrl={video.hlsUrl}
          title={video.title}
          duration={video.duration}
          onBookmarkAdd={handleBookmarkAdd}
        />

        {/* Video Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-4">{video.title}</h1>

            {/* Stats and Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {video.views} views
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {video.uploadedAt.toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={isLiked ? 'default' : 'outline'}
                  className="gap-2"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <ThumbsUp className="w-4 h-4" />
                  {isLiked ? 'Liked' : 'Like'}
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Bookmark className="w-4 h-4" />
                  Save
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Uploader Info */}
            <div className="flex items-center gap-3 mt-6 p-4 bg-muted rounded-lg">
              <Avatar>
                <AvatarFallback>{video.uploadedBy.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-foreground">{video.uploadedBy}</p>
                <p className="text-xs text-muted-foreground">Video uploaded on {video.uploadedAt.toLocaleDateString()}</p>
              </div>
              <Button variant="outline">Subscribe</Button>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h2 className="font-semibold text-foreground mb-2">About this video</h2>
              <p className="text-muted-foreground">{video.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {video.categories.map((cat) => (
                  <Badge key={cat} variant="secondary">
                    {cat}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {video.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs: Description, Transcript, Bookmarks */}
          <Tabs defaultValue="transcript" className="space-y-4">
            <TabsList>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks ({bookmarks.length})</TabsTrigger>
              <TabsTrigger value="versions">Video Versions</TabsTrigger>
            </TabsList>

            {/* Transcript */}
            <TabsContent value="transcript">
              <Card>
                <CardHeader>
                  <CardTitle>Video Transcript</CardTitle>
                  <CardDescription>Full transcript of the video content</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-xs text-foreground overflow-x-auto">
                    {transcript}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookmarks */}
            <TabsContent value="bookmarks">
              <Card>
                <CardHeader>
                  <CardTitle>Bookmarks</CardTitle>
                  <CardDescription>Your saved timestamps in this video</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookmarks.length > 0 ? (
                    <div className="space-y-3">
                      {bookmarks.map((bookmark) => (
                        <div
                          key={bookmark.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{bookmark.title}</p>
                            <p className="text-xs text-muted-foreground">{formatTime(bookmark.timestamp)}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            Go to
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No bookmarks yet. Add one while watching!</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Video Versions */}
            <TabsContent value="versions">
              <Card>
                <CardHeader>
                  <CardTitle>Available Versions</CardTitle>
                  <CardDescription>Different quality options for this video</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {video.transcodedVersions.map((version, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{version.resolution}</p>
                          <p className="text-xs text-muted-foreground">
                            {version.format} • {version.bitrate}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Related Videos */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Related Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedVideos.map((relatedVideo) => (
                <Card
                  key={relatedVideo.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/videos/${relatedVideo.id}`)}
                >
                  <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary/5">
                    <img 
                      src={relatedVideo.thumbnail} 
                      alt={relatedVideo.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-90 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-2">{relatedVideo.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{relatedVideo.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{relatedVideo.views} views</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
