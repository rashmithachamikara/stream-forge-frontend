'use client';

import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { Button } from '@/components/ui/button';
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
  hlsUrl: string;
  title: string;
  duration: number;
  onBookmarkAdd?: (timestamp: number) => void;
}

type QualityOption = {
  value: string;
  label: string;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  hlsUrl,
  title,
  duration,
  onBookmarkAdd,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('auto');
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle play/pause
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

  // Handle mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle progress bar change
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Auto-hide controls
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

  // Add bookmark
  const handleAddBookmark = () => {
    if (onBookmarkAdd) {
      onBookmarkAdd(currentTime);
      setBookmarkTitle('');
      setShowBookmarkInput(false);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const displayDuration = mediaDuration > 0 ? mediaDuration : duration;
  const progressPercent = displayDuration > 0 ? (currentTime / displayDuration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center bg-black rounded-lg overflow-hidden fullscreen:rounded-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && !showSettings && setShowControls(false)}
    >
      {/* Video Element */}
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
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {(isLoading || playbackError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm z-10">
          {playbackError || 'Loading video...'}
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold">{title}</h3>
        </div>

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          {!isPlaying && (
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-white/30 hover:bg-white/50"
              onClick={togglePlay}
            >
              <Play className="h-8 w-8 text-white fill-white" />
            </Button>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={displayDuration}
              value={currentTime}
              onChange={handleProgressChange}
              className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-red-500"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${progressPercent}%, rgba(255,255,255,0.3) ${progressPercent}%, rgba(255,255,255,0.3) 100%)`,
              }}
            />
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex items-center gap-2">
              {/* Play/Pause */}
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

              {/* Volume */}
              <div className="flex items-center gap-2 group">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover:w-24 transition-all h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>

              {/* Time Display */}
              <span className="text-sm text-white ml-2 font-mono">
                {formatTime(currentTime)} / {formatTime(displayDuration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Bookmark */}
              {showBookmarkInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Bookmark title"
                    value={bookmarkTitle}
                    onChange={(e) => setBookmarkTitle(e.target.value)}
                    className="px-2 py-1 text-xs rounded bg-white/20 text-white placeholder:text-white/50 border border-white/20"
                  />
                  <Button
                    size="sm"
                    className="h-6 text-xs"
                    onClick={handleAddBookmark}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setShowBookmarkInput(true)}
                  title="Add bookmark"
                >
                  <Bookmark className="h-5 w-5" />
                </Button>
              )}

              {/* Share */}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Share video"
              >
                <Share2 className="h-5 w-5" />
              </Button>

              {/* Settings */}
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

              {/* Fullscreen */}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
