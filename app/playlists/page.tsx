'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Play, Clock } from 'lucide-react';
import { Playlist } from '@/types';

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: '1',
      title: 'Getting Started',
      description: 'Essential videos for new users to get started with the platform.',
      createdBy: 'admin',
      createdAt: new Date('2024-01-15'),
      videoIds: ['1', '2'],
      isPublic: true,
    },
    {
      id: '2',
      title: 'Training Series',
      description: 'Complete training series for team onboarding.',
      createdBy: 'jane',
      createdAt: new Date('2024-01-20'),
      videoIds: ['2', '3', '4'],
      isPublic: false,
    },
    {
      id: '3',
      title: 'Product Updates',
      description: 'Latest product feature announcements and updates.',
      createdBy: 'jane',
      createdAt: new Date('2024-02-01'),
      videoIds: ['4'],
      isPublic: true,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    title: '',
    description: '',
    isPublic: true,
  });

  const filteredPlaylists = playlists.filter(
    (playlist) =>
      playlist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      playlist.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    const playlist: Playlist = {
      id: String(playlists.length + 1),
      title: newPlaylist.title,
      description: newPlaylist.description,
      createdBy: 'current-user',
      createdAt: new Date(),
      videoIds: [],
      isPublic: newPlaylist.isPublic,
    };
    setPlaylists([...playlists, playlist]);
    setNewPlaylist({ title: '', description: '', isPublic: true });
    setIsCreateOpen(false);
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists(playlists.filter((p) => p.id !== id));
  };

  return (
    <DashboardLayout title="Playlists">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Playlists</h1>
            <p className="text-muted-foreground">Create and manage your video playlists</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary text-white font-medium">
                <Plus className="w-4 h-4" />
                New Playlist
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border border-border">
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
                <DialogDescription>Create a new playlist to organize videos</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePlaylist} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Playlist Title</label>
                  <Input
                    placeholder="Enter playlist title"
                    value={newPlaylist.title}
                    onChange={(e) => setNewPlaylist({ ...newPlaylist, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    placeholder="Describe what this playlist is about"
                    value={newPlaylist.description}
                    onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newPlaylist.isPublic}
                    onChange={(e) => setNewPlaylist({ ...newPlaylist, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm font-medium cursor-pointer">
                    Make this playlist public
                  </label>
                </div>
                <Button type="submit" className="w-full">
                  Create Playlist
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Input
          placeholder="Search playlists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />

        {/* Playlists Grid */}
        {filteredPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaylists.map((playlist) => (
              <Card key={playlist.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center rounded-t-lg relative overflow-hidden">
                  <div className="flex gap-2 opacity-30 scale-150">
                    {[0, 1, 2].map((i) => (
                      <Play key={i} className="w-8 h-8 text-primary fill-primary" />
                    ))}
                  </div>
                  <Badge className="absolute top-3 right-3">
                    {playlist.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-lg line-clamp-2 mb-2">{playlist.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">
                    {playlist.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pb-4 border-b border-border">
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {playlist.videoIds.length} videos
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {playlist.createdAt.toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 bg-transparent" size="sm">
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 text-destructive hover:text-destructive bg-transparent"
                      onClick={() => handleDeletePlaylist(playlist.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">No playlists found</p>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Playlist
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
