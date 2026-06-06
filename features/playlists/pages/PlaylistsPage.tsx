'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { apiClient } from '@/shared/lib/api';
import {
  CreatePlaylistRequest,
  Playlist,
  PlaylistVideosPage,
  PlaylistVisibility,
  UpdatePlaylistRequest,
} from '@/features/playlists/types';
import { Video } from '@/features/videos/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Edit2, Loader2, Play, Plus, Trash2 } from 'lucide-react';

const PLAYLIST_PAGE_SIZE = 24;
const PLAYLIST_VIDEO_PAGE_SIZE = 12;
const PLAYLIST_PREVIEW_SIZE = 3;

type PlaylistFormState = {
  name: string;
  description: string;
  visibility: PlaylistVisibility;
};

const emptyPlaylistForm = (): PlaylistFormState => ({
  name: '',
  description: '',
  visibility: 'Public',
});

export default function PlaylistsPage() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistPreviews, setPlaylistPreviews] = useState<Record<string, Video[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isVideosOpen, setIsVideosOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newPlaylist, setNewPlaylist] = useState<PlaylistFormState>(emptyPlaylistForm);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [editPlaylist, setEditPlaylist] = useState<PlaylistFormState>(emptyPlaylistForm);

  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistVideosPage, setPlaylistVideosPage] = useState<PlaylistVideosPage | null>(null);
  const [playlistVideosPageNumber, setPlaylistVideosPageNumber] = useState(1);
  const [isVideosLoading, setIsVideosLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPlaylists = async () => {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getMyPlaylists({
        page: currentPage,
        pageSize: PLAYLIST_PAGE_SIZE,
      });

      if (!isMounted) {
        return;
      }

      if (response.success && response.data) {
        setPlaylists(response.data.items);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setPlaylists([]);
        setTotalPages(1);
        setError(response.error ?? 'Failed to load playlists');
      }

      setIsLoading(false);
    };

    void loadPlaylists();

    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  useEffect(() => {
    if (!isVideosOpen || !selectedPlaylist) {
      return;
    }

    let isMounted = true;

    const loadPlaylistVideos = async () => {
      setIsVideosLoading(true);

      const response = await apiClient.getPlaylistVideos(selectedPlaylist.id, {
        page: playlistVideosPageNumber,
        pageSize: PLAYLIST_VIDEO_PAGE_SIZE,
      });

      if (!isMounted) {
        return;
      }

      if (response.success && response.data) {
        setPlaylistVideosPage(response.data);
      } else {
        setPlaylistVideosPage(null);
        setError(response.error ?? 'Failed to load playlist videos');
      }

      setIsVideosLoading(false);
    };

    void loadPlaylistVideos();

    return () => {
      isMounted = false;
    };
  }, [isVideosOpen, playlistVideosPageNumber, selectedPlaylist]);

  useEffect(() => {
    if (playlists.length === 0) {
      setPlaylistPreviews({});
      return;
    }

    let isMounted = true;

    const loadPlaylistPreviews = async () => {
      const previewEntries = await Promise.all(
        playlists.map(async (playlist) => {
          if (playlist.videoCount <= 0) {
            return [playlist.id, []] as const;
          }

          const response = await apiClient.getPlaylistVideos(playlist.id, {
            page: 1,
            pageSize: PLAYLIST_PREVIEW_SIZE,
          });

          return [playlist.id, response.success && response.data ? response.data.videos.items : []] as const;
        })
      );

      if (!isMounted) {
        return;
      }

      setPlaylistPreviews(Object.fromEntries(previewEntries));
    };

    void loadPlaylistPreviews();

    return () => {
      isMounted = false;
    };
  }, [playlists]);

  const filteredPlaylists = useMemo(() => {
    const trimmedSearch = searchTerm.trim().toLowerCase();
    if (!trimmedSearch) {
      return playlists;
    }

    return playlists.filter((playlist) => {
      return (
        playlist.name.toLowerCase().includes(trimmedSearch) ||
        playlist.description.toLowerCase().includes(trimmedSearch)
      );
    });
  }, [playlists, searchTerm]);

  const handleCreatePlaylist = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload: CreatePlaylistRequest = {
      name: newPlaylist.name.trim(),
      description: newPlaylist.description.trim(),
      visibility: newPlaylist.visibility,
    };

    if (!payload.name) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await apiClient.createPlaylist(payload);

    if (response.success && response.data) {
      setPlaylists((current) => [response.data!, ...current]);
      setNewPlaylist(emptyPlaylistForm());
      setIsCreateOpen(false);
    } else {
      setError(response.error ?? 'Failed to create playlist');
    }

    setIsSubmitting(false);
  };

  const openEditDialog = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setEditPlaylist({
      name: playlist.name,
      description: playlist.description,
      visibility: playlist.visibility,
    });
    setIsEditOpen(true);
  };

  const handleUpdatePlaylist = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingPlaylist) {
      return;
    }

    const payload: UpdatePlaylistRequest = {
      name: editPlaylist.name.trim(),
      description: editPlaylist.description.trim(),
      visibility: editPlaylist.visibility,
    };

    setIsSubmitting(true);
    setError(null);

    const response = await apiClient.updatePlaylist(editingPlaylist.id, payload);

    if (response.success && response.data) {
      setPlaylists((current) =>
        current.map((playlist) => (playlist.id === editingPlaylist.id ? response.data! : playlist))
      );
      if (selectedPlaylist?.id === editingPlaylist.id) {
        setSelectedPlaylist(response.data);
      }
      setIsEditOpen(false);
      setEditingPlaylist(null);
    } else {
      setError(response.error ?? 'Failed to update playlist');
    }

    setIsSubmitting(false);
  };

  const handleDeletePlaylist = async (playlist: Playlist) => {
    if (!window.confirm(`Delete "${playlist.name}"?`)) {
      return;
    }

    setError(null);

    const response = await apiClient.deletePlaylist(playlist.id);

    if (response.success) {
      setPlaylists((current) => current.filter((item) => item.id !== playlist.id));
      if (selectedPlaylist?.id === playlist.id) {
        setSelectedPlaylist(null);
        setPlaylistVideosPage(null);
        setIsVideosOpen(false);
      }
    } else {
      setError(response.error ?? 'Failed to delete playlist');
    }
  };

  const openPlaylistVideos = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setPlaylistVideosPage(null);
    setPlaylistVideosPageNumber(1);
    setIsVideosOpen(true);
  };

  const handleRemoveVideo = async (playlistId: string, videoId: string) => {
    const response = await apiClient.removeVideoFromPlaylist(playlistId, videoId);

    if (!response.success) {
      setError(response.error ?? 'Failed to remove video from playlist');
      return;
    }

    setPlaylistVideosPage((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        playlist: {
          ...current.playlist,
          videoCount: Math.max(0, current.playlist.videoCount - 1),
        },
        videos: {
          ...current.videos,
          items: current.videos.items.filter((video) => video.id !== videoId),
          totalCount: Math.max(0, current.videos.totalCount - 1),
        },
      };
    });

    setPlaylists((current) =>
      current.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, videoCount: Math.max(0, playlist.videoCount - 1) }
          : playlist
      )
    );
  };

  const renderPlaylistForm = (
    value: PlaylistFormState,
    onChange: (nextValue: PlaylistFormState) => void,
    submitLabel: string
  ) => (
    <form
      onSubmit={(event) => {
        if (submitLabel === 'Create Playlist') {
          void handleCreatePlaylist(event);
        } else {
          void handleUpdatePlaylist(event);
        }
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium">Playlist name</label>
        <Input
          placeholder="Enter playlist name"
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          placeholder="Describe what this playlist is about"
          value={value.description}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Visibility</label>
        <Select
          value={value.visibility}
          onValueChange={(nextValue: PlaylistVisibility) => onChange({ ...value, visibility: nextValue })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Public">Public</SelectItem>
            <SelectItem value="Private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );

  const renderPlaylistPreview = (playlist: Playlist) => {
    const previews = playlistPreviews[playlist.id] ?? [];

    if (previews.length === 1) {
      const video = previews[0];

      return (
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover"
        />
      );
    }

    if (previews.length > 1) {
      const previewStack = previews.slice(0, PLAYLIST_PREVIEW_SIZE);
      const layouts = [
        'left-0 top-[8%] h-[100%] w-[100%]',
        'left-[1%] top-[4%] h-[99%] w-[98%]',
        'left-[2%] top-[0%] h-[98%] w-[96%]',
      ];

      return (
        <div className="relative h-full w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-black/15 via-transparent to-black/25" />
          {[...previewStack].reverse().map((video, reverseIndex) => {
            const index = previewStack.length - reverseIndex - 1;

            return (
              <div
                key={video.id}
                className={`absolute overflow-hidden rounded-xl border border-white/15 bg-black/70 shadow-[0_18px_38px_rgba(0,0,0,0.38)] ring-1 ring-white/10 ${layouts[index]}`}
                style={{ zIndex: reverseIndex + 1 }}
              >
                <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-white/5" />
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="flex gap-2 opacity-30 scale-150">
        {[0, 1, 2].map((index) => (
          <Play key={index} className="h-8 w-8 fill-primary text-primary" />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout title="Playlists">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Playlists</h1>
            <p className="text-muted-foreground">Create and manage your saved video collections.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary text-white font-medium">
                <Plus className="h-4 w-4" />
                New Playlist
              </Button>
            </DialogTrigger>
            <DialogContent className="border border-border bg-background">
              <DialogHeader>
                <DialogTitle>Create Playlist</DialogTitle>
                <DialogDescription>Organize videos into a playlist you can revisit later.</DialogDescription>
              </DialogHeader>
              {renderPlaylistForm(newPlaylist, setNewPlaylist, 'Create Playlist')}
            </DialogContent>
          </Dialog>
        </div>

        <Input
          placeholder="Search playlists..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="max-w-md"
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading playlists...
            </CardContent>
          </Card>
        ) : filteredPlaylists.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPlaylists.map((playlist) => (
                <Card key={playlist.id} className="flex flex-col gap-0 overflow-hidden border-t-0 pt-0 pb-6 transition-shadow hover:shadow-lg">
                  <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-t-lg bg-gradient-to-br from-primary/10 to-primary/5">
                    {renderPlaylistPreview(playlist)}
                    <Badge className="absolute right-3 top-3">
                      {playlist.visibility === 'Public' ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <h3 className="mb-2 line-clamp-2 text-lg font-semibold">{playlist.name}</h3>
                    <p className="mb-4 flex-1 line-clamp-3 text-sm text-muted-foreground">
                      {playlist.description || 'No description provided.'}
                    </p>

                    <div className="mb-4 flex items-center justify-between border-b border-border pb-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {playlist.videoCount} videos
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {playlist.updatedAt.toLocaleDateString()}
                      </span>
                    </div>

                    <p className="mb-4 text-xs text-muted-foreground">Created by {playlist.ownerName}</p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="h-10 flex-1 bg-transparent"
                        onClick={() => openPlaylistVideos(playlist)}
                      >
                        <Play className="mr-1 h-4 w-4" />
                        View videos
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 bg-transparent"
                        onClick={() => openEditDialog(playlist)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 bg-transparent text-destructive hover:text-destructive"
                        onClick={() => void handleDeletePlaylist(playlist)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage <= 1}
              >
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
          </>
        ) : (
          <Card className="py-12 text-center">
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                {searchTerm ? 'No playlists match your search.' : 'No playlists yet.'}
              </p>
              <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create your first playlist
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) {
              setEditingPlaylist(null);
            }
          }}
        >
          <DialogContent className="border border-border bg-background">
            <DialogHeader>
              <DialogTitle>Edit Playlist</DialogTitle>
              <DialogDescription>Update the playlist details shown to viewers.</DialogDescription>
            </DialogHeader>
            {renderPlaylistForm(editPlaylist, setEditPlaylist, 'Save Changes')}
          </DialogContent>
        </Dialog>

        <Dialog
          open={isVideosOpen}
          onOpenChange={(open) => {
            setIsVideosOpen(open);
            if (!open) {
              setSelectedPlaylist(null);
              setPlaylistVideosPage(null);
              setPlaylistVideosPageNumber(1);
            }
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-hidden border border-border bg-background sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedPlaylist?.name ?? 'Playlist videos'}</DialogTitle>
              <DialogDescription>
                {selectedPlaylist?.description || 'Browse the videos saved in this playlist.'}
              </DialogDescription>
            </DialogHeader>

            {isVideosLoading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading playlist videos...
              </div>
            ) : playlistVideosPage && playlistVideosPage.videos.items.length > 0 ? (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div className="space-y-3">
                  {playlistVideosPage.videos.items.map((video) => (
                    <div
                      key={video.id}
                      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{video.title}</p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{video.description}</p>
                      </div>
                      <div className="flex gap-2 sm:flex-shrink-0">
                        <Button variant="outline" onClick={() => router.push(`/videos/${video.id}`)}>
                          Open video
                        </Button>
                        <Button
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            selectedPlaylist && void handleRemoveVideo(selectedPlaylist.id, video.id)
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPlaylistVideosPageNumber((page) => Math.max(1, page - 1))}
                    disabled={playlistVideosPage.videos.page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {playlistVideosPage.videos.page} of {playlistVideosPage.videos.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPlaylistVideosPageNumber((page) =>
                        Math.min(playlistVideosPage.videos.totalPages, page + 1)
                      )
                    }
                    disabled={!playlistVideosPage.videos.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                This playlist does not have any videos yet.
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
