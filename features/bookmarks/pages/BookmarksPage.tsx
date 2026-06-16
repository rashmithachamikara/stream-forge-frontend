'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { apiClient } from '@/shared/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Play, Loader2 } from 'lucide-react';
import { Bookmark } from '@/features/bookmarks/types';

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

const getBookmarkTitle = (bookmark: Bookmark) => bookmark.note || `Bookmark at ${formatTime(bookmark.timestampSeconds)}`;

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBookmarks = async () => {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getMyBookmarks({ page: 1, pageSize: 50 });

      if (!isMounted) {
        return;
      }

      if (response.success && response.data) {
        setBookmarks(response.data.items);
      } else {
        setBookmarks([]);
        setError(response.error ?? 'Failed to load bookmarks');
      }

      setIsLoading(false);
    };

    void loadBookmarks();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const title = getBookmarkTitle(bookmark).toLowerCase();
    const videoTitle = bookmark.video?.title?.toLowerCase() ?? '';
    const query = searchTerm.toLowerCase();

    return title.includes(query) || videoTitle.includes(query);
  });

  const handleDeleteBookmark = async (bookmark: Bookmark) => {
    const response = await apiClient.deleteBookmark(bookmark.videoId, bookmark.id);

    if (response.success) {
      setBookmarks((current) => current.filter((item) => item.id !== bookmark.id));
    } else {
      setError(response.error ?? 'Failed to delete bookmark');
    }
  };

  return (
    <DashboardLayout title="My Bookmarks">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl">Bookmarks</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Saved timestamps from videos you are watching ({bookmarks.length}).</p>
        </div>

        <Input
          placeholder="Search bookmarks by title or video..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="max-w-md"
        />

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card className="py-12 text-center">
            <CardContent className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading bookmarks...
            </CardContent>
          </Card>
        ) : filteredBookmarks.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bookmark</TableHead>
                      <TableHead>Video</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookmarks.map((bookmark) => (
                      <TableRow key={bookmark.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{getBookmarkTitle(bookmark)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {bookmark.video?.title || 'Unknown Video'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatTime(bookmark.timestampSeconds)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {bookmark.updatedAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="mr-2 h-8 w-8"
                            onClick={() => router.push(`/videos/${bookmark.videoId}`)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => void handleDeleteBookmark(bookmark)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="py-12 text-center">
            <CardContent>
              <p className="mb-4 text-muted-foreground">No bookmarks yet</p>
              <p className="text-sm text-muted-foreground">
                Click the bookmark icon while watching videos to save timestamps.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/20 bg-accent/40">
          <CardHeader>
            <CardTitle className="text-base">About Bookmarks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Bookmarks let you save important timestamps within videos. Click the bookmark icon in the video player to save a timestamp.
            </p>
            <p>
              You can return to the video from this page and pick up from your saved moments.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
