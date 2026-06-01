'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Trash2, Play, Clock } from 'lucide-react';
import { Bookmark } from '@/features/bookmarks/types';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([
    {
      id: '1',
      videoId: '1',
      userId: 'user1',
      timestamp: 120,
      title: 'Key concept introduction',
      createdAt: new Date('2024-02-15'),
    },
    {
      id: '2',
      videoId: '1',
      userId: 'user1',
      timestamp: 300,
      title: 'Important feature demo',
      createdAt: new Date('2024-02-15'),
    },
    {
      id: '3',
      videoId: '2',
      userId: 'user1',
      timestamp: 450,
      title: 'Advanced techniques',
      createdAt: new Date('2024-02-14'),
    },
    {
      id: '4',
      videoId: '3',
      userId: 'user1',
      timestamp: 890,
      title: 'Project example walkthrough',
      createdAt: new Date('2024-02-13'),
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const videoTitles: Record<string, string> = {
    '1': 'Getting Started with Stream Forge',
    '2': 'Advanced Features Tour',
    '3': 'Company Training Session',
    '4': 'Product Demo',
  };

  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      videoTitles[bookmark.videoId]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteBookmark = (id: string) => {
    setBookmarks(bookmarks.filter((b) => b.id !== id));
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

  return (
    <DashboardLayout title="My Bookmarks">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Bookmarks</h1>
          <p className="text-muted-foreground">
            Saved timestamps from videos you're watching ({bookmarks.length})
          </p>
        </div>

        {/* Search */}
        <Input
          placeholder="Search bookmarks by title or video..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />

        {/* Bookmarks Table */}
        {filteredBookmarks.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bookmark Title</TableHead>
                      <TableHead>Video</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookmarks.map((bookmark) => (
                      <TableRow key={bookmark.id} className="hover:bg-muted/50">
                        <TableCell>
                          <span className="font-medium">{bookmark.title}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm">
                            {videoTitles[bookmark.videoId] || 'Unknown Video'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatTime(bookmark.timestamp)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {bookmark.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 mr-2">
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteBookmark(bookmark.id)}
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
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">No bookmarks yet</p>
              <p className="text-sm text-muted-foreground">
                Click the bookmark icon while watching videos to save timestamps
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">About Bookmarks</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Bookmarks let you save important timestamps within videos. Click the bookmark icon in the video player to save a timestamp.
            </p>
            <p>
              You can give each bookmark a custom title and return to that exact moment in the video by clicking the 'Play' button.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
