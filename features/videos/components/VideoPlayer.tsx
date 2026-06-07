'use client';

import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bookmark as BookmarkType } from '@/features/bookmarks/types';
import { AnalyticsEventType } from '@/features/admin/types';
import { apiClient } from '@/shared/lib/api';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Share2,
  Bookmark,
} from 'lucide-react';

interface VideoPlayerProps {
  videoId?: string;
  hlsUrl: string;
  title: string;
  duration: number;
  bookmarks?: BookmarkType[];
  onBookmarkAdd?: (timestamp: number, note?: string) => void;
  isBookmarkSaving?: boolean;
}

type QualityOption = {
  value: string;
  label: string;
};

const ANALYTICS_TRACK_PAUSE = process.env.NEXT_PUBLIC_ANALYTICS_TRACK_PAUSE !== 'false';
const ANALYTICS_TRACK_SEEK = process.env.NEXT_PUBLIC_ANALYTICS_TRACK_SEEK !== 'false';
const ANALYTICS_TRACK_CLOSE = process.env.NEXT_PUBLIC_ANALYTICS_TRACK_CLOSE !== 'false';
const ANALYTICS_PLAY_HEARTBEAT_MS = 10000;

const createAnalyticsSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  hlsUrl,
  title,
  duration,
  bookmarks = [],
  onBookmarkAdd,
  isBookmarkSaving = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const analyticsSessionIdRef = useRef(createAnalyticsSessionId());
  const watchedSinceLastEventRef = useRef(0);
  const lastPlaybackPositionRef = useRef(0);
  const isSeekingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('auto');
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [showBookmarksPanel, setShowBookmarksPanel] = useState(false);
  const [mediaDuration, setMediaDuration] = useState(duration);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [qualityOptions, setQualityOptions] = useState<QualityOption[]>([]);
  const [usesNativeHls, setUsesNativeHls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    let hls: Hls | null = null;
    hlsRef.current = null;
    setIsLoading(true);
    setPlaybackError(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setQuality('auto');
    setQualityOptions([]);
    setUsesNativeHls(false);
    setShowSettings(false);
    setShowBookmarksPanel(false);
    analyticsSessionIdRef.current = createAnalyticsSessionId();
    watchedSinceLastEventRef.current = 0;
    lastPlaybackPositionRef.current = 0;
    isSeekingRef.current = false;

    if (Hls.isSupported()) {
      const hlsInstance = new Hls();
      hls = hlsInstance;
      hlsRef.current = hlsInstance;
      hlsInstance.loadSource(hlsUrl);
      hlsInstance.attachMedia(video);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        setQualityOptions(
          hlsInstance.levels.map((level, index) => {
            const bitrateKbps = Math.round(level.bitrate / 1000);
            const resolution = level.height ? `${level.height}p` : `${bitrateKbps} kbps`;

            return {
              value: String(index),
              label: level.height ? `${resolution} (${bitrateKbps} kbps)` : resolution,
            };
          })
        );
      });
      hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setPlaybackError('Unable to load this video stream.');
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      setUsesNativeHls(true);
      video.src = hlsUrl;
    } else {
      setPlaybackError('HLS playback is not supported in this browser.');
      setIsLoading(false);
    }

    return () => {
      hls?.destroy();
      hlsRef.current = null;
      video.removeAttribute('src');
      video.load();
    };
  }, [hlsUrl]);

  const sendAnalyticsEvent = (eventType: AnalyticsEventType) => {
    if (!videoId || !videoRef.current) {
      return;
    }

    const durationWatched = Math.floor(watchedSinceLastEventRef.current);
    watchedSinceLastEventRef.current = 0;

    void apiClient.recordAnalyticsEvent(videoId, {
      sessionId: analyticsSessionIdRef.current,
      eventType,
      eventTime: new Date().toISOString(),
      position: Math.floor(videoRef.current.currentTime),
      durationWatched,
    });
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleQualityChange = (value: string) => {
    setQuality(value);
    setShowSettings(false);

    if (!hlsRef.current) {
      return;
    }

    if (value === 'auto') {
      hlsRef.current.currentLevel = -1;
      return;
    }

    hlsRef.current.nextLevel = Number(value);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          setPlaybackError('Unable to start video playback.');
        });
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) {
      return;
    }

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        void containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else if (document.fullscreenElement) {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const nextTime = videoRef.current.currentTime;
      const delta = nextTime - lastPlaybackPositionRef.current;

      if (!isSeekingRef.current && isPlaying && delta > 0 && delta < 5) {
        watchedSinceLastEventRef.current += delta;
      }

      lastPlaybackPositionRef.current = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleProgressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      lastPlaybackPositionRef.current = newTime;
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleAddBookmark = () => {
    if (onBookmarkAdd) {
      onBookmarkAdd(currentTime, bookmarkTitle.trim() || undefined);
      setBookmarkTitle('');
    }
  };

  const handleBookmarkSeek = (timestamp: number) => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.currentTime = timestamp;
    setCurrentTime(timestamp);
    lastPlaybackPositionRef.current = timestamp;
    setShowControls(true);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    lastPlaybackPositionRef.current = videoRef.current?.currentTime ?? 0;
    sendAnalyticsEvent('Play');
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (ANALYTICS_TRACK_PAUSE) {
      sendAnalyticsEvent('Pause');
    }
  };

  const handleSeeking = () => {
    isSeekingRef.current = true;
    if (ANALYTICS_TRACK_SEEK) {
      sendAnalyticsEvent('Seek');
    }
  };

  const handleSeeked = () => {
    isSeekingRef.current = false;
    lastPlaybackPositionRef.current = videoRef.current?.currentTime ?? currentTime;
  };

  const handleEnded = () => {
    setIsPlaying(false);
    sendAnalyticsEvent('Complete');
  };

  useEffect(() => {
    if (!isPlaying || !videoId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      sendAnalyticsEvent('Play');
    }, ANALYTICS_PLAY_HEARTBEAT_MS);

    return () => window.clearInterval(intervalId);
  }, [isPlaying, videoId]);

  useEffect(() => {
    if (!videoId || !ANALYTICS_TRACK_CLOSE) {
      return;
    }

    const handleClose = () => sendAnalyticsEvent('Close');
    window.addEventListener('pagehide', handleClose);

    return () => {
      window.removeEventListener('pagehide', handleClose);
      handleClose();
    };
  }, [videoId]);

  const displayDuration = mediaDuration > 0 ? mediaDuration : duration;
  const progressPercent = displayDuration > 0 ? (currentTime / displayDuration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full flex items-center justify-center overflow-hidden rounded-lg bg-black fullscreen:rounded-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && !showSettings && !showBookmarksPanel && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full max-h-full bg-black object-contain fullscreen:h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
            setMediaDuration(videoRef.current.duration);
          }
        }}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onError={() => {
          setPlaybackError('Unable to load this video stream.');
          setIsLoading(false);
        }}
        onPlay={handlePlay}
        onPause={handlePause}
        onSeeking={handleSeeking}
        onSeeked={handleSeeked}
        onEnded={handleEnded}
      />

      {showBookmarksPanel && (
        <div className="absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-white/10 bg-zinc-950/95 text-white shadow-2xl backdrop-blur sm:w-80">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <h3 className="font-semibold">Bookmarks</h3>
              <p className="text-xs text-white/60">{title}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setShowBookmarksPanel(false)}
            >
              Close
            </Button>
          </div>

          <div className="space-y-4 border-b border-white/10 px-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Add bookmark at {formatTime(currentTime)}</p>
              <p className="text-xs text-white/60">Save the current playback position with an optional note.</p>
            </div>
            <Input
              placeholder="Bookmark note (optional)"
              value={bookmarkTitle}
              onChange={(event) => setBookmarkTitle(event.target.value)}
              className="border-white/15 bg-white/5 text-white placeholder:text-white/45"
            />
            <Button className="w-full" onClick={handleAddBookmark} disabled={isBookmarkSaving}>
              {isBookmarkSaving ? 'Saving...' : 'Add bookmark'}
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {bookmarks.length > 0 ? (
              <div className="space-y-3">
                {bookmarks.map((bookmark) => (
                  <button
                    key={bookmark.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"
                    onClick={() => handleBookmarkSeek(bookmark.timestampSeconds)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {bookmark.note || `Bookmark at ${formatTime(bookmark.timestampSeconds)}`}
                      </p>
                      <p className="text-xs text-white/60">{formatTime(bookmark.timestampSeconds)}</p>
                    </div>
                    <span className="text-xs text-white/50">Jump</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-white/60">
                No bookmarks yet for this video.
              </div>
            )}
          </div>
        </div>
      )}

      {(isLoading || playbackError) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 text-sm text-white">
          {playbackError || 'Loading video...'}
        </div>
      )}

      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="absolute left-0 right-0 top-0 p-4">
          <h3 className="font-semibold text-white">{title}</h3>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          {!isPlaying && (
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-white/30 hover:bg-white/50"
              onClick={togglePlay}
            >
              <Play className="h-8 w-8 fill-white text-white" />
            </Button>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 space-y-3 p-4">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={displayDuration}
              value={currentTime}
              onChange={handleProgressChange}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-lg bg-white/30 accent-red-500"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${progressPercent}%, rgba(255,255,255,0.3) ${progressPercent}%, rgba(255,255,255,0.3) 100%)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="relative flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-white" />
                ) : (
                  <Play className="h-5 w-5 fill-white" />
                )}
              </Button>

              <div className="group flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="h-1 w-0 cursor-pointer appearance-none rounded-lg bg-white/30 accent-red-500 transition-all group-hover:w-24"
                />
              </div>

              <span className="ml-2 font-mono text-sm text-white">
                {formatTime(currentTime)} / {formatTime(displayDuration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="gap-2 px-3 text-white hover:bg-white/20"
                onClick={() => {
                  setShowBookmarksPanel((isOpen) => !isOpen);
                  setShowControls(true);
                }}
                title="Open bookmarks"
              >
                <Bookmark className="h-5 w-5" />
                Bookmarks
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Share video"
              >
                <Share2 className="h-5 w-5" />
              </Button>

              <div className="relative">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  title="Video settings"
                  aria-expanded={showSettings}
                  aria-haspopup="menu"
                  onClick={() => {
                    setShowSettings((isOpen) => !isOpen);
                    setShowControls(true);
                  }}
                >
                  <Settings className="h-5 w-5" />
                </Button>

                {showSettings && (
                  <div
                    role="menu"
                    className="absolute bottom-11 right-0 z-30 w-52 overflow-hidden rounded-md border border-white/15 bg-zinc-950 text-white shadow-xl"
                  >
                    <div className="px-3 py-2 text-sm font-medium">Quality</div>
                    <div className="h-px bg-white/15" />
                    <div className="p-1">
                      {usesNativeHls ? (
                        <button
                          type="button"
                          disabled
                          role="menuitemradio"
                          aria-checked="true"
                          className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-white/70"
                        >
                          <span className="size-2 rounded-full bg-white/70" />
                          Native HLS
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            role="menuitemradio"
                            aria-checked={quality === 'auto'}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                            onClick={() => handleQualityChange('auto')}
                          >
                            <span className={`size-2 rounded-full ${quality === 'auto' ? 'bg-white' : 'bg-transparent'}`} />
                            Auto
                          </button>
                          {qualityOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              role="menuitemradio"
                              aria-checked={quality === option.value}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                              onClick={() => handleQualityChange(option.value)}
                            >
                              <span className={`size-2 rounded-full ${quality === option.value ? 'bg-white' : 'bg-transparent'}`} />
                              {option.label}
                            </button>
                          ))}
                          {qualityOptions.length === 0 && (
                            <button
                              type="button"
                              disabled
                              role="menuitemradio"
                              aria-checked="false"
                              className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-white/70"
                            >
                              <span className="size-2 rounded-full bg-transparent" />
                              Loading qualities...
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
