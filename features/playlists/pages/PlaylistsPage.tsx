'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { apiClient } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import {
  CreatePlaylistRequest,
  Playlist,
  PlaylistVideosPage,
  PlaylistVisibility,
  UpdatePlaylistRequest,
} from '@/features/playlists/types';
import { Video } from '@/features/videos/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Clock,
  Edit2,
  Loader2,
  Play,
  Plus,
  Trash2,
  Globe,
  Lock,
  MoreVertical,
  SearchSlash,
} from 'lucide-react';

const PLAYLIST_PAGE_SIZE = 24;
const PLAYLIST_VIDEO_PAGE_SIZE = 12;

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

const formatRelativeDate = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return date.toLocaleDateString();
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

export default function PlaylistsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playlistIdParam = searchParams.get('playlistId');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newPlaylist, setNewPlaylist] = useState<PlaylistFormState>(emptyPlaylistForm);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [editPlaylist, setEditPlaylist] = useState<PlaylistFormState>(emptyPlaylistForm);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);

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
        const items = response.data.items;
        setPlaylists(items);
        setTotalPages(response.data.totalPages || 1);

      } else {
        setPlaylists([]);
        setTotalPages(1);
        setError(response.error ?? 'Failed to load playlists');
      }

      setIsLoading(false);
    };

    void loadPlaylists();

  }, [currentPage]);

  useEffect(() => {
    if (playlists.length > 0) {
      const target = playlistIdParam ? playlists.find(p => p.id === playlistIdParam) : playlists[0];
      if (target) {
        if (selectedPlaylist?.id !== target.id) {
          setSelectedPlaylist(target);
          setPlaylistVideosPageNumber(1);
        }
      } else {
        setSelectedPlaylist(playlists[0]);
      }
    } else {
      setSelectedPlaylist(null);
    }
  }, [playlistIdParam, playlists, selectedPlaylist?.id]);

  useEffect(() => {
    if (!selectedPlaylist) {
      setPlaylistVideosPage(null);
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
  }, [playlistVideosPageNumber, selectedPlaylist]);

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
      const created = response.data;
      setPlaylists((current) => [created, ...current]);
      setNewPlaylist(emptyPlaylistForm());
      setIsCreateOpen(false);
      setSelectedPlaylist(created);
      setPlaylistVideosPageNumber(1);
      React.startTransition(() => {
        router.replace(`/playlists?playlistId=${created.id}`);
      });
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
      const updated = response.data;
      setPlaylists((current) =>
        current.map((playlist) => (playlist.id === editingPlaylist.id ? updated : playlist))
      );
      if (selectedPlaylist?.id === editingPlaylist.id) {
        setSelectedPlaylist(updated);
      }
      setIsEditOpen(false);
      setEditingPlaylist(null);
    } else {
      setError(response.error ?? 'Failed to update playlist');
    }

    setIsSubmitting(false);
  };

  const triggerDeleteConfirm = (playlist: Playlist) => {
    setPlaylistToDelete(playlist);
    setIsDeleteOpen(true);
  };

  const handleDeletePlaylist = async (playlist: Playlist) => {
    setError(null);
    setIsSubmitting(true);

    const response = await apiClient.deletePlaylist(playlist.id);

    if (response.success) {
      const remainingPlaylists = playlists.filter((item) => item.id !== playlist.id);
      setPlaylists(remainingPlaylists);
      if (selectedPlaylist?.id === playlist.id) {
        if (remainingPlaylists.length > 0) {
          setSelectedPlaylist(remainingPlaylists[0]);
          React.startTransition(() => {
            router.replace(`/playlists?playlistId=${remainingPlaylists[0].id}`);
          });
        } else {
          setSelectedPlaylist(null);
          setPlaylistVideosPage(null);
          React.startTransition(() => {
            router.replace('/playlists');
          });
        }
      }
      setIsDeleteOpen(false);
      setPlaylistToDelete(null);
    } else {
      setError(response.error ?? 'Failed to delete playlist');
    }

    setIsSubmitting(false);
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
        <label className="text-xs font-medium text-muted-foreground">Playlist name</label>
        <Input
          placeholder="Enter playlist name"
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Description</label>
        <Textarea
          placeholder="Describe what this playlist is about"
          value={value.description}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Visibility</label>
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
      <Button type="submit" size="sm" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Saving...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );

  return (
    <DashboardLayout title="Playlists">
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Collections</p>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Playlists</h1>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 rounded-md text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer">
                <Plus className="size-3.5" /> New playlist
              </button>
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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Left Column: Playlist List */}
          <div className="space-y-3">
            <Input
              placeholder="Search playlists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />

            {isLoading ? (
              <div className="flex items-center gap-2 py-8 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading playlists...
              </div>
            ) : filteredPlaylists.length > 0 ? (
              <div className="space-y-1">
                {filteredPlaylists.map((playlist) => (
                  <Link
                    key={playlist.id}
                    href={`/playlists?playlistId=${playlist.id}`}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-md transition-colors cursor-pointer block',
                      selectedPlaylist?.id === playlist.id
                        ? 'bg-accent text-foreground'
                        : 'hover:bg-accent/50 text-foreground/80'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold truncate pr-2">{playlist.name}</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex shrink-0 cursor-pointer">
                            {playlist.visibility === 'Public' ? (
                              <Globe className={cn('size-3.5', selectedPlaylist?.id === playlist.id ? 'text-foreground/70' : 'text-muted-foreground')} />
                            ) : (
                              <Lock className={cn('size-3.5', selectedPlaylist?.id === playlist.id ? 'text-foreground/70' : 'text-muted-foreground')} />
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center">
                          This playlist is {playlist.visibility.toLowerCase()}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className={cn(
                      'text-[11px] mt-0.5 font-mono',
                      selectedPlaylist?.id === playlist.id ? 'text-foreground/70' : 'text-muted-foreground'
                    )}>
                      {playlist.videoCount} videos · {formatRelativeDate(playlist.updatedAt)}
                    </p>
                  </Link>
                ))}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] px-2"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] px-2"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {searchTerm ? 'No playlists match your search.' : 'No playlists yet.'}
              </div>
            )}
          </div>

          {/* Right Column: Playlist Details & Video List */}
          <div className="space-y-6">
            {selectedPlaylist ? (
              <>
                {/* Playlist Info Box */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Playlist</p>
                      <h2 className="text-xl font-bold tracking-tight mt-1">{selectedPlaylist.name}</h2>
                      <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
                        {selectedPlaylist.description || 'No description provided.'}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 border border-border bg-popover">
                        <DropdownMenuItem
                          onClick={() => openEditDialog(selectedPlaylist)}
                          className="cursor-pointer text-xs"
                        >
                          <Edit2 className="mr-2 size-3.5" /> Edit details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => triggerDeleteConfirm(selectedPlaylist)}
                          className="cursor-pointer text-destructive focus:text-destructive text-xs"
                        >
                          <Trash2 className="mr-2 size-3.5" /> Delete playlist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <Link
                      href={playlistVideosPage?.videos.items[0] ? `/videos/${playlistVideosPage.videos.items[0].id}?playlistId=${selectedPlaylist.id}` : '#'}
                      onClick={() => {
                        localStorage.setItem('streamforge_playlist_autoplay', 'true');
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 rounded-md text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer",
                        (!playlistVideosPage || playlistVideosPage.videos.items.length === 0) && "opacity-50 pointer-events-none"
                      )}
                    >
                      <Play className="size-3.5 fill-current" /> Play all
                    </Link>
                    <span className="text-[11px] text-foreground/85 font-mono">
                      {selectedPlaylist.videoCount} videos
                    </span>
                  </div>
                </div>

                {/* Playlist Video Items */}
                {isVideosLoading ? (
                  <div className="flex items-center gap-2 py-12 justify-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin animate-spin" />
                    Loading playlist videos...
                  </div>
                ) : playlistVideosPage && playlistVideosPage.videos.items.length > 0 ? (
                  <div className="space-y-4">
                    <div className="border border-border rounded-lg bg-card overflow-hidden divide-y divide-border">
                      {playlistVideosPage.videos.items.map((video, idx) => {
                        const indexNumber = idx + 1 + (playlistVideosPageNumber - 1) * PLAYLIST_VIDEO_PAGE_SIZE;
                        return (
                          <div key={video.id} className="flex items-center gap-4 p-3 hover:bg-accent/50 group transition-colors">
                            <span className="text-xs font-mono text-muted-foreground w-6 text-right shrink-0">
                              {indexNumber}
                            </span>

                            <Link
                              href={`/videos/${video.id}?playlistId=${selectedPlaylist.id}`}
                              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                            >
                              <img
                                src={video.thumbnail}
                                alt=""
                                className="w-24 aspect-video object-cover rounded ring-1 ring-border shrink-0 bg-muted"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                  {video.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                  {video.uploadedBy} · {video.categories[0] || 'Uncategorized'}
                                </p>
                              </div>
                            </Link>

                            <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                              {formatTime(video.duration)}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-background rounded transition-all shrink-0"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleRemoveVideo(selectedPlaylist.id, video.id);
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {playlistVideosPage.videos.totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-border pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] px-2"
                          onClick={() => setPlaylistVideosPageNumber((page) => Math.max(1, page - 1))}
                          disabled={playlistVideosPage.videos.page <= 1}
                        >
                          Previous
                        </Button>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {playlistVideosPage.videos.page} / {playlistVideosPage.videos.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] px-2"
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
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center px-6 py-20 text-center border border-border rounded-lg bg-card">
                    <div className="mb-4 text-muted-foreground/60">
                      <SearchSlash className="size-8 stroke-[1.5]" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground tracking-tight">No videos in playlist</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      This playlist doesn't contain any videos yet. Add videos from the Library or Viewer Dashboard.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-24 text-center border border-border rounded-lg bg-card">
                <div className="mb-4 text-muted-foreground/40">
                  <Play className="size-8 stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight">No playlist selected</h3>
                <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Select a playlist from the sidebar to view details and watch videos, or create a new one.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

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
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {
            setPlaylistToDelete(null);
          }
        }}
      >
        <DialogContent className="border border-border bg-background max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Playlist</DialogTitle>
            <DialogDescription>
              {"Are you sure you want to delete \"" + (playlistToDelete?.name || "") + "\"? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (playlistToDelete) {
                  void handleDeletePlaylist(playlistToDelete);
                }
              }}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
