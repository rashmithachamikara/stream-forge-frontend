'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bookmark as BookmarkType } from '@/features/bookmarks/types';
import { AnalyticsEventType } from '@/features/admin/types';
import { apiClient } from '@/shared/lib/api';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Kbd } from '@/components/ui/kbd';
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
  authToken?: string | null;
  bookmarks?: BookmarkType[];
  onBookmarkAdd?: (timestamp: number, note?: string) => void;
  isBookmarkSaving?: boolean;
  onEnded?: () => void;
  autoPlay?: boolean;
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
  authToken,
  bookmarks = [],
  onBookmarkAdd,
  isBookmarkSaving = false,
  onEnded,
  autoPlay,
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
  const [seekIndicator, setSeekIndicator] = useState<string | null>(null);
  const [showSeekIndicator, setShowSeekIndicator] = useState(false);
  const seekIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedSeekRef = useRef<number>(0);

  const [volumeIndicator, setVolumeIndicator] = useState<string | null>(null);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const volumeIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const volumeIndicatorRef = useRef<string | null>(null);

  const setVolumeIndicatorWithRef = (val: string | null) => {
    volumeIndicatorRef.current = val;
    setVolumeIndicator(val);
  };

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
      const hlsInstance = new Hls({
        fetchSetup: authToken
          ? (context, init) => {
              const headers = new Headers(init?.headers);
              headers.set('Authorization', `Bearer ${authToken}`);

              return new Request(context.url, {
                ...init,
                headers,
              });
            }
          : undefined,
        xhrSetup: authToken
          ? (xhr) => {
              xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
            }
          : undefined,
      });
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
  }, [authToken, hlsUrl]);

  const autoPlayRef = useRef(autoPlay);
  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  useEffect(() => {
    if (autoPlayRef.current && videoRef.current) {
      const handleCanPlay = () => {
        videoRef.current?.play().catch((err) => {
          console.warn('Autoplay failed:', err);
        });
      };

      const videoElement = videoRef.current;
      videoElement.addEventListener('canplay', handleCanPlay);

      if (videoElement.readyState >= 2) {
        handleCanPlay();
      }

      return () => {
        videoElement.removeEventListener('canplay', handleCanPlay);
      };
    }
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

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (!videoRef.current.paused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          setPlaybackError('Unable to start video playback.');
        });
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) {
      return;
    }

    const isCurrentlyFullscreen = document.fullscreenElement === containerRef.current;
    if (!isCurrentlyFullscreen) {
      if (containerRef.current.requestFullscreen) {
        void containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else if (document.fullscreenElement) {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const startSeekIndicator = useCallback((seconds: number) => {
    if (seekIndicatorTimeoutRef.current) {
      clearTimeout(seekIndicatorTimeoutRef.current);
      seekIndicatorTimeoutRef.current = null;
    }
    
    const isNewSeek = accumulatedSeekRef.current === 0;
    accumulatedSeekRef.current += seconds;
    const sign = accumulatedSeekRef.current > 0 ? '+' : '';
    const text = `${sign}${accumulatedSeekRef.current}s`;
    
    setSeekIndicator(text);
    
    if (isNewSeek) {
      setShowSeekIndicator(false);
      // Brief timeout to trigger the entry transition
      setTimeout(() => {
        setShowSeekIndicator(true);
      }, 10);
    } else {
      setShowSeekIndicator(true);
    }
  }, []);

  const releaseSeekIndicator = useCallback(() => {
    if (seekIndicatorTimeoutRef.current) {
      clearTimeout(seekIndicatorTimeoutRef.current);
    }
    
    seekIndicatorTimeoutRef.current = setTimeout(() => {
      setShowSeekIndicator(false);
      seekIndicatorTimeoutRef.current = setTimeout(() => {
        setSeekIndicator(null);
        accumulatedSeekRef.current = 0;
        seekIndicatorTimeoutRef.current = null;
      }, 150); // Matches transition duration
    }, 350); // Visible time before fade out begins
  }, []);

  const startVolumeIndicator = useCallback((vol: number, muted: boolean) => {
    if (volumeIndicatorTimeoutRef.current) {
      clearTimeout(volumeIndicatorTimeoutRef.current);
      volumeIndicatorTimeoutRef.current = null;
    }
    
    const displayVol = (muted || vol === 0) ? 'Muted' : `Volume: ${Math.round(vol * 100)}%`;
    const isNew = volumeIndicatorRef.current === null;
    setVolumeIndicatorWithRef(displayVol);
    
    if (isNew) {
      setShowVolumeIndicator(false);
      setTimeout(() => {
        setShowVolumeIndicator(true);
      }, 10);
    } else {
      setShowVolumeIndicator(true);
    }
  }, []);

  const releaseVolumeIndicator = useCallback(() => {
    if (volumeIndicatorTimeoutRef.current) {
      clearTimeout(volumeIndicatorTimeoutRef.current);
    }
    
    volumeIndicatorTimeoutRef.current = setTimeout(() => {
      setShowVolumeIndicator(false);
      volumeIndicatorTimeoutRef.current = setTimeout(() => {
        setVolumeIndicatorWithRef(null);
        volumeIndicatorTimeoutRef.current = null;
      }, 150); // Matches transition duration
    }, 350); // Visible time before fade out begins
  }, []);

  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const nextTime = videoRef.current.currentTime;
      const delta = nextTime - lastPlaybackPositionRef.current;

      if (!isSeekingRef.current && isPlaying && delta > 0 && delta < 5) {
        watchedSinceLastEventRef.current += delta;
      }

      lastPlaybackPositionRef.current = nextTime;
      setCurrentTime(nextTime);
    }
  }, [isPlaying]);

  const handleProgressChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      lastPlaybackPositionRef.current = newTime;
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    const isCurrentlyPlaying = videoRef.current ? !videoRef.current.paused : false;
    if (isCurrentlyPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, []);

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
    if (onEnded) {
      onEnded();
    }
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.hasAttribute('contenteditable'))
      ) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      switch (event.key) {
        case ' ':
        case 'k':
        case 'K':
          event.preventDefault();
          togglePlay();
          handleMouseMove();
          break;
        case 'm':
        case 'M':
          event.preventDefault();
          toggleMute();
          startVolumeIndicator(video.volume, video.muted);
          handleMouseMove();
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          toggleFullscreen();
          handleMouseMove();
          break;
        case 'b':
        case 'B':
          event.preventDefault();
          setShowBookmarksPanel((prev) => !prev);
          handleMouseMove();
          break;
        case 'ArrowLeft':
        case 'j':
        case 'J':
          event.preventDefault();
          const seekBackTime = Math.max(0, video.currentTime - 5);
          video.currentTime = seekBackTime;
          setCurrentTime(seekBackTime);
          lastPlaybackPositionRef.current = seekBackTime;
          startSeekIndicator(-5);
          handleMouseMove();
          break;
        case 'ArrowRight':
        case 'l':
        case 'L':
          event.preventDefault();
          const seekForwardTime = Math.min(video.duration || duration, video.currentTime + 5);
          video.currentTime = seekForwardTime;
          setCurrentTime(seekForwardTime);
          lastPlaybackPositionRef.current = seekForwardTime;
          startSeekIndicator(5);
          handleMouseMove();
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (video.muted) {
            video.muted = false;
            setIsMuted(false);
          }
          const volumeUp = Math.min(1, video.volume + 0.1);
          video.volume = volumeUp;
          setVolume(volumeUp);
          startVolumeIndicator(volumeUp, false);
          handleMouseMove();
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (video.muted) {
            video.muted = false;
            setIsMuted(false);
          }
          const volumeDown = Math.max(0, video.volume - 0.1);
          video.volume = volumeDown;
          setVolume(volumeDown);
          startVolumeIndicator(volumeDown, false);
          handleMouseMove();
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.hasAttribute('contenteditable'))
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'j':
        case 'J':
        case 'l':
        case 'L':
          event.preventDefault();
          releaseSeekIndicator();
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'm':
        case 'M':
          event.preventDefault();
          releaseVolumeIndicator();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [duration, togglePlay, toggleMute, toggleFullscreen, handleMouseMove, startSeekIndicator, releaseSeekIndicator, startVolumeIndicator, releaseVolumeIndicator]);

  const displayDuration = mediaDuration > 0 ? mediaDuration : duration;
  const progressPercent = displayDuration > 0 ? (currentTime / displayDuration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full flex items-center justify-center overflow-hidden rounded-lg bg-black fullscreen:rounded-none group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && !showSettings && !showBookmarksPanel && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full max-h-full bg-black object-contain fullscreen:h-full cursor-pointer"
        onClick={togglePlay}
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

      {seekIndicator && (
        <div className={`absolute inset-0 flex items-center pointer-events-none z-20 transition-all duration-150 ease-out ${
          seekIndicator.startsWith('-') ? 'justify-start pl-[20%]' : 'justify-end pr-[20%]'
        } ${showSeekIndicator ? 'opacity-100 scale-100' : 'opacity-0 scale-98'}`}>
          <div className="px-4 py-2 rounded-full bg-zinc-950/75 border border-white/10 text-xs font-mono font-bold text-white backdrop-blur-sm shadow-md">
            {seekIndicator}
          </div>
        </div>
      )}

      {volumeIndicator && (
        <div className={`absolute inset-x-0 top-12 flex justify-center pointer-events-none z-20 transition-all duration-150 ease-out ${
          showVolumeIndicator ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-98 -translate-y-1'
        }`}>
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-950/75 border border-white/10 text-xs font-mono font-bold text-white backdrop-blur-sm shadow-md">
            {volumeIndicator === 'Muted' ? (
              <VolumeX className="h-3.5 w-3.5 text-red-400" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-primary" />
            )}
            <span>{volumeIndicator}</span>
          </div>
        </div>
      )}

      {showBookmarksPanel && (
        <div className="absolute top-3 right-3 bottom-3 z-30 flex w-full max-w-sm flex-col border border-border bg-card/75 backdrop-blur-md text-foreground shadow-2xl sm:w-80 rounded-lg">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Bookmarks</h3>
              <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{title}</p>
            </div>
            <button
              onClick={() => setShowBookmarksPanel(false)}
              className="text-xs text-muted-foreground hover:text-foreground hover:bg-accent px-2 py-1 rounded bg-transparent border-0 cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>

          <div className="space-y-3 border-b border-border/60 px-4 py-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">Add bookmark at {formatTime(currentTime)}</p>
              <p className="text-[10px] text-muted-foreground">Save the current position with a note.</p>
            </div>
            <input
              placeholder="Bookmark note (optional)"
              value={bookmarkTitle}
              onChange={(event) => setBookmarkTitle(event.target.value)}
              className="w-full border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary rounded px-3 py-1.5 text-xs"
            />
            <button
              onClick={handleAddBookmark}
              disabled={isBookmarkSaving}
              className="w-full text-xs font-semibold px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isBookmarkSaving ? 'Saving...' : 'Add bookmark'}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 text-foreground">
            {bookmarks.length > 0 ? (
              <div className="space-y-2">
                {bookmarks.map((bookmark) => (
                  <button
                    key={bookmark.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded border border-border/60 bg-muted/30 px-2.5 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                    onClick={() => handleBookmarkSeek(bookmark.timestampSeconds)}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-xs font-medium text-foreground">
                        {bookmark.note || `Bookmark at ${formatTime(bookmark.timestampSeconds)}`}
                      </p>
                      <p className="text-[10px] text-primary font-mono mt-0.5">{formatTime(bookmark.timestampSeconds)}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-medium">Jump</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground/60">
                No bookmarks yet for this video.
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading && !playbackError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="flex items-center justify-center p-3 rounded-full bg-zinc-950/60 border border-white/10 backdrop-blur-sm shadow-lg">
            <span className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        </div>
      )}

      {playbackError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/85 text-xs text-white/90 p-4 text-center backdrop-blur-sm">
          <p className="max-w-xs leading-relaxed font-mono">{playbackError}</p>
        </div>
      )}

      {/* Play/Pause center overlay */}
      {!isPlaying && !isLoading && !playbackError && (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button
            className="h-14 w-14 rounded-full bg-zinc-950/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-zinc-950/60 hover:scale-105 transition-all cursor-pointer pointer-events-auto shadow-lg"
            onClick={togglePlay}
          >
            <Play className="h-6 w-6 fill-white text-white ml-0.5" />
          </button>
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 p-4 pb-3 flex flex-col gap-2 transition-opacity duration-300 bg-gradient-to-t from-black/90 via-black/30 to-transparent ${
          showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >

        {/* Progress Slider */}
        <div className="flex items-center px-0.5">
          <input
            type="range"
            min="0"
            max={displayDuration}
            step="any"
            value={currentTime}
            onChange={handleProgressChange}
            className="h-[3px] hover:h-[5px] transition-all w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform"
            style={{
              background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${progressPercent}%, rgba(255,255,255,0.25) ${progressPercent}%, rgba(255,255,255,0.25) 100%)`,
            }}
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="h-8 w-8 text-white hover:text-white/80 rounded flex items-center justify-center transition-colors cursor-pointer bg-transparent border-0"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="flex items-center gap-1.5 font-sans">
                <span>{isPlaying ? "Pause" : "Play"}</span>
                <Kbd>K</Kbd>
              </TooltipContent>
            </Tooltip>

            <div className="group flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="h-8 w-8 text-white hover:text-white/80 rounded flex items-center justify-center transition-colors cursor-pointer bg-transparent border-0"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="flex items-center gap-1.5 font-sans">
                  <span>{isMuted ? "Unmute" : "Mute"}</span>
                  <Kbd>M</Kbd>
                </TooltipContent>
              </Tooltip>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/20 accent-primary transition-all group-hover:w-16 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                style={{
                  background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${volume * 100}%, rgba(255,255,255,0.25) ${volume * 100}%, rgba(255,255,255,0.25) 100%)`,
                }}
              />
            </div>

            <span className="w-px h-3 bg-white/20 mx-1 shrink-0" />

            <span className="font-mono text-xs text-white/90 tracking-tight tabular-nums select-none">
              {formatTime(currentTime)} / {formatTime(displayDuration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-white/90 hover:text-white rounded border border-white/20 hover:bg-white/5 transition-colors cursor-pointer bg-transparent"
                  onClick={() => {
                    setShowBookmarksPanel((isOpen) => !isOpen);
                    setShowControls(true);
                  }}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span className="font-mono text-[10px] tracking-tight">{bookmarks.length} Bookmarks</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="flex items-center gap-1.5 font-sans">
                <span>Bookmarks</span>
                <Kbd>B</Kbd>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="h-8 w-8 text-white/90 hover:text-white rounded flex items-center justify-center transition-colors cursor-pointer bg-transparent border-0"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="font-sans">
                <span>Share Video</span>
              </TooltipContent>
            </Tooltip>

            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`h-8 w-8 text-white/90 hover:text-white rounded flex items-center justify-center transition-colors cursor-pointer bg-transparent border-0 ${showSettings ? 'text-white bg-white/10' : ''}`}
                    onClick={() => {
                      setShowSettings((isOpen) => !isOpen);
                      setShowControls(true);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="font-sans">
                  <span>Settings</span>
                </TooltipContent>
              </Tooltip>

              {showSettings && (
                <div
                  role="menu"
                  className="absolute bottom-9 right-0 z-30 w-40 overflow-hidden rounded border border-border/60 bg-card/75 backdrop-blur-md text-foreground shadow-xl p-1"
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Quality</div>
                  <div className="h-px bg-border/60 my-1" />
                  <div className="space-y-0.5">
                    {usesNativeHls ? (
                      <button
                        type="button"
                        disabled
                        className="flex w-full cursor-default items-center gap-2 rounded px-2 py-1 text-left text-xs text-muted-foreground/60 font-mono"
                      >
                        <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                        Native HLS
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-foreground hover:bg-accent focus:bg-accent focus:outline-none cursor-pointer font-mono bg-transparent border-0"
                          onClick={() => handleQualityChange('auto')}
                        >
                          <span className={`size-1.5 rounded-full ${quality === 'auto' ? 'bg-primary' : 'bg-transparent'}`} />
                          Auto
                        </button>
                        {qualityOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-foreground hover:bg-accent focus:bg-accent focus:outline-none cursor-pointer font-mono bg-transparent border-0"
                            onClick={() => handleQualityChange(option.value)}
                          >
                            <span className={`size-1.5 rounded-full ${quality === option.value ? 'bg-primary' : 'bg-transparent'}`} />
                            {option.label.split(' ')[0]}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="h-8 w-8 text-white/90 hover:text-white rounded flex items-center justify-center transition-colors cursor-pointer bg-transparent border-0"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="flex items-center gap-1.5 font-sans">
                <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                <Kbd>F</Kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
