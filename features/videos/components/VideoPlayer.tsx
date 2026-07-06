'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Hls from 'hls.js';
import { Bookmark as BookmarkType } from '@/features/bookmarks/types';
import { AnalyticsEventType } from '@/features/admin/types';
import { apiClient } from '@/shared/lib/api';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Kbd } from '@/components/ui/kbd';
import { Switch } from '@/components/ui/switch';
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
  ClosedCaption,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type CaptionTrack = {
  id: string;
  label: string;
  src: string;
  srcLang: string;
  isDefault?: boolean;
};

interface VideoPlayerProps {
  videoId?: string;
  hlsUrl: string;
  title: string;
  duration: number;
  authToken?: string | null;
  bookmarks?: BookmarkType[];
  captions?: CaptionTrack[];
  selectedCaptionId?: string | null;
  onCaptionChange?: (captionId: string | null) => void;
  onBookmarkAdd?: (timestamp: number, note?: string) => void;
  isBookmarkSaving?: boolean;
  onEnded?: () => void;
  autoPlay?: boolean;
  requestedSeekTime?: number | null;
  onPlaybackTimeChange?: (time: number) => void;
}

type QualityOption = {
  value: string;
  label: string;
};

type SettingsView = 'main' | 'captions';

type CaptionColorOption = {
  value: string;
  label: string;
};

type CaptionPreferences = {
  enabled: boolean;
  language: string | null;
  fontColor: string;
  fontSize: number;
  fontOpacity: number;
  backgroundColor: string;
  backgroundOpacity: number;
  textShadowEnabled: boolean;
};

const DEFAULT_CAPTION_PREFERENCES: CaptionPreferences = {
  enabled: false,
  language: null,
  fontColor: '#ffffff',
  fontSize: 2,
  fontOpacity: 1,
  backgroundColor: '#000000',
  backgroundOpacity: 0.7,
  textShadowEnabled: false,
};

const CAPTION_COLOR_OPTIONS: CaptionColorOption[] = [
  { value: '#ffffff', label: 'White' },
  { value: '#000000', label: 'Black' },
  { value: '#facc15', label: 'Yellow' },
  { value: '#93c5fd', label: 'Blue' },
  { value: '#86efac', label: 'Green' },
];

const ANALYTICS_TRACK_PAUSE = process.env.NEXT_PUBLIC_ANALYTICS_TRACK_PAUSE !== 'false';
const ANALYTICS_TRACK_SEEK = process.env.NEXT_PUBLIC_ANALYTICS_TRACK_SEEK !== 'false';
const ANALYTICS_TRACK_CLOSE = process.env.NEXT_PUBLIC_ANALYTICS_TRACK_CLOSE !== 'false';
const ANALYTICS_PLAY_HEARTBEAT_MS = 10000;
const CAPTION_PREFERENCES_STORAGE_KEY = 'streamforge_caption_preferences';

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

const hexToRgbString = (value: string) => {
  const normalized = value.replace('#', '');
  const padded = normalized.length === 3
    ? normalized
        .split('')
        .map((character) => `${character}${character}`)
        .join('')
    : normalized;

  const red = parseInt(padded.slice(0, 2), 16);
  const green = parseInt(padded.slice(2, 4), 16);
  const blue = parseInt(padded.slice(4, 6), 16);

  return `${red}, ${green}, ${blue}`;
};

const getStoredCaptionPreferences = (): CaptionPreferences | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CAPTION_PREFERENCES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CaptionPreferences) : null;
  } catch {
    return null;
  }
};

const getInitialCaptionPreferences = () =>
  getStoredCaptionPreferences() ?? DEFAULT_CAPTION_PREFERENCES;

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  hlsUrl,
  title,
  duration,
  authToken,
  bookmarks = [],
  captions = [],
  selectedCaptionId = null,
  onCaptionChange,
  onBookmarkAdd,
  isBookmarkSaving = false,
  onEnded,
  autoPlay,
  requestedSeekTime = null,
  onPlaybackTimeChange,
}) => {
  const searchParams = useSearchParams();
  const tParam = searchParams?.get('t');
  const startTime = tParam ? parseInt(tParam, 10) : 0;
  const lastSeekTimeRef = useRef<number>(-1);
  const initialStartTimeRef = useRef<number>(startTime);

  useEffect(() => {
    initialStartTimeRef.current = startTime;
  }, [hlsUrl, startTime]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const analyticsSessionIdRef = useRef(createAnalyticsSessionId());
  const watchedSinceLastEventRef = useRef(0);
  const lastPlaybackPositionRef = useRef(0);
  const isSeekingRef = useRef(false);
  const captionTrackRefs = useRef<Record<string, HTMLTrackElement | null>>({});
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const bookmarkInputRef = useRef<HTMLInputElement>(null);
  const showBookmarksPanelRef = useRef(false);
  const handleAddBookmarkRef = useRef<() => void>(() => {});

  const progressInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);
  const [bufferedRanges, setBufferedRanges] = useState<{ start: number; end: number }[]>([]);

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
  const [settingsView, setSettingsView] = useState<SettingsView>('main');
  const [captionFontColor, setCaptionFontColor] = useState(() => getInitialCaptionPreferences().fontColor);
  const [captionFontSize, setCaptionFontSize] = useState(() => getInitialCaptionPreferences().fontSize);
  const [captionFontOpacity, setCaptionFontOpacity] = useState(() => getInitialCaptionPreferences().fontOpacity);
  const [captionBackgroundColor, setCaptionBackgroundColor] = useState(() => getInitialCaptionPreferences().backgroundColor);
  const [captionBackgroundOpacity, setCaptionBackgroundOpacity] = useState(() => getInitialCaptionPreferences().backgroundOpacity);
  const [captionTextShadowEnabled, setCaptionTextShadowEnabled] = useState(() => getInitialCaptionPreferences().textShadowEnabled);
  const [captionEnabledPreference, setCaptionEnabledPreference] = useState(() => getInitialCaptionPreferences().enabled);
  const [preferredCaptionLanguage, setPreferredCaptionLanguage] = useState<string | null>(() => getInitialCaptionPreferences().language);
  const captionPreferencesLoadedRef = useRef(true);

  const activeCaptionTrack = captions.find((caption) => caption.id === selectedCaptionId) ?? null;
  const defaultCaptionId = captions[0]?.id ?? null;
  const preferredCaptionTrack =
    captions.find((caption) => preferredCaptionLanguage && caption.srcLang === preferredCaptionLanguage) ?? null;

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

  const resetCaptionPreferences = useCallback(() => {
    setCaptionFontColor(DEFAULT_CAPTION_PREFERENCES.fontColor);
    setCaptionFontSize(DEFAULT_CAPTION_PREFERENCES.fontSize);
    setCaptionFontOpacity(DEFAULT_CAPTION_PREFERENCES.fontOpacity);
    setCaptionBackgroundColor(DEFAULT_CAPTION_PREFERENCES.backgroundColor);
    setCaptionBackgroundOpacity(DEFAULT_CAPTION_PREFERENCES.backgroundOpacity);
    setCaptionTextShadowEnabled(DEFAULT_CAPTION_PREFERENCES.textShadowEnabled);
  }, []);

  const applyCaptionSelection = useCallback((captionId: string | null) => {
    setCaptionEnabledPreference(captionId !== null);

    if (captionId === null) {
      onCaptionChange?.(null);
      return;
    }

    const selectedTrack = captions.find((caption) => caption.id === captionId) ?? null;
    if (selectedTrack) {
      setPreferredCaptionLanguage(selectedTrack.srcLang);
    }

    onCaptionChange?.(captionId);
  }, [captions, onCaptionChange]);

  useEffect(() => {
    if (!captionPreferencesLoadedRef.current || !onCaptionChange || captions.length === 0) {
      return;
    }

    if (!captionEnabledPreference && selectedCaptionId !== null) {
      onCaptionChange(null);
      return;
    }

    if (captionEnabledPreference && selectedCaptionId === null) {
      onCaptionChange(preferredCaptionTrack?.id ?? defaultCaptionId);
    }
  }, [
    captionEnabledPreference,
    captions.length,
    defaultCaptionId,
    onCaptionChange,
    preferredCaptionTrack,
    selectedCaptionId,
  ]);

  useEffect(() => {
    if (!captionPreferencesLoadedRef.current || typeof window === 'undefined') {
      return;
    }

    const preferences: CaptionPreferences = {
      enabled: captionEnabledPreference,
      language: preferredCaptionLanguage,
      fontColor: captionFontColor,
      fontSize: captionFontSize,
      fontOpacity: captionFontOpacity,
      backgroundColor: captionBackgroundColor,
      backgroundOpacity: captionBackgroundOpacity,
      textShadowEnabled: captionTextShadowEnabled,
    };

    window.localStorage.setItem(CAPTION_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [
    captionBackgroundColor,
    captionBackgroundOpacity,
    captionEnabledPreference,
    captionFontColor,
    captionFontOpacity,
    captionFontSize,
    captionTextShadowEnabled,
    preferredCaptionLanguage,
  ]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    let hls: Hls | null = null;
    hlsRef.current = null;
    setIsLoading(true);
    setPlaybackError(null);
    setCurrentTime(initialStartTimeRef.current);
    setIsPlaying(false);
    setQuality('auto');
    setQualityOptions([]);
    setUsesNativeHls(false);
    setShowSettings(false);
    setSettingsView('main');
    setShowBookmarksPanel(false);
    analyticsSessionIdRef.current = createAnalyticsSessionId();
    watchedSinceLastEventRef.current = 0;
    lastPlaybackPositionRef.current = initialStartTimeRef.current;
    isSeekingRef.current = false;
    lastSeekTimeRef.current = -1;

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
    if (videoRef.current && startTime > 0 && lastSeekTimeRef.current !== startTime) {
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
      lastPlaybackPositionRef.current = startTime;
      lastSeekTimeRef.current = startTime;
    }
  }, [startTime]);

  useEffect(() => {
    if (!videoRef.current || requestedSeekTime === null || Number.isNaN(requestedSeekTime)) {
      return;
    }

    videoRef.current.currentTime = requestedSeekTime;
    setCurrentTime(requestedSeekTime);
    lastPlaybackPositionRef.current = requestedSeekTime;
    setShowControls(true);
  }, [requestedSeekTime]);

  useEffect(() => {
    onPlaybackTimeChange?.(currentTime);
  }, [currentTime, onPlaybackTimeChange]);

  useEffect(() => {
    captions.forEach((caption) => {
      const trackRef = captionTrackRefs.current[caption.id];
      if (!trackRef) {
        return;
      }

      trackRef.track.mode = selectedCaptionId === caption.id ? 'showing' : 'disabled';
    });
  }, [captions, selectedCaptionId]);

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

  const sendAnalyticsEvent = useCallback((eventType: AnalyticsEventType) => {
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
  }, [videoId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!showSettings) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (settingsMenuRef.current?.contains(target) || settingsButtonRef.current?.contains(target)) {
        return;
      }

      setShowSettings(false);
      setSettingsView('main');
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [showSettings]);

  const handleQualityChange = (value: string) => {
    setQuality(value);

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
    
    if (accumulatedSeekRef.current === 0) {
      setShowSeekIndicator(false);
      setSeekIndicator(null);
      return;
    }
    
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

  const updateProgressDOM = useCallback((time: number) => {
    const progressInput = progressInputRef.current;
    if (progressInput) {
      const dur = videoRef.current?.duration || duration || 1;
      const percent = (time / dur) * 100;
      progressInput.value = String(time);
      progressInput.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percent}%, transparent ${percent}%, transparent 100%)`;
    }
  }, [duration]);

  const startProgressLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    const loop = () => {
      if (videoRef.current) {
        updateProgressDOM(videoRef.current.currentTime);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [updateProgressDOM]);

  const stopProgressLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (videoRef.current) {
      updateProgressDOM(videoRef.current.currentTime);
    }
  }, [updateProgressDOM]);

  useEffect(() => {
    if (isPlaying) {
      startProgressLoop();
    } else {
      stopProgressLoop();
    }
    return () => stopProgressLoop();
  }, [isPlaying, startProgressLoop, stopProgressLoop]);

  useEffect(() => {
    if (!rafRef.current) {
      updateProgressDOM(currentTime);
    }
  }, [currentTime, updateProgressDOM]);

  const handleProgress = useCallback(() => {
    if (videoRef.current) {
      const buffered = videoRef.current.buffered;
      const ranges: { start: number; end: number }[] = [];
      const dur = videoRef.current.duration || duration;
      for (let i = 0; i < buffered.length; i++) {
        const start = buffered.start(i);
        const end = Math.min(buffered.end(i), dur);
        if (start < end) {
          ranges.push({ start, end });
        }
      }
      setBufferedRanges(ranges);
    }
  }, [duration]);

  const handleProgressChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      lastPlaybackPositionRef.current = newTime;
      updateProgressDOM(newTime);
    }
  }, [updateProgressDOM]);

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

  const handleAddBookmark = useCallback(() => {
    if (onBookmarkAdd && videoRef.current) {
      onBookmarkAdd(videoRef.current.currentTime, bookmarkTitle.trim() || undefined);
      setBookmarkTitle('');
    }
  }, [onBookmarkAdd, bookmarkTitle]);

  useEffect(() => {
    showBookmarksPanelRef.current = showBookmarksPanel;
  }, [showBookmarksPanel]);

  useEffect(() => {
    handleAddBookmarkRef.current = handleAddBookmark;
  }, [handleAddBookmark]);

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
  }, [isPlaying, sendAnalyticsEvent, videoId]);

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
  }, [sendAnalyticsEvent, videoId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Ctrl + Enter to submit bookmark
      if (showBookmarksPanelRef.current && event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        handleAddBookmarkRef.current();
        return;
      }

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
        case 'c':
        case 'C':
          if (captions.length > 0) {
            event.preventDefault();
            const nextCaptionId = selectedCaptionId === null ? defaultCaptionId : null;
            applyCaptionSelection(nextCaptionId);
            handleMouseMove();
          }
          break;
        case '/':
          if (showBookmarksPanelRef.current) {
            event.preventDefault();
            bookmarkInputRef.current?.focus();
          }
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
  }, [
    applyCaptionSelection,
    captions,
    defaultCaptionId,
    duration,
    handleMouseMove,
    releaseSeekIndicator,
    releaseVolumeIndicator,
    selectedCaptionId,
    startSeekIndicator,
    startVolumeIndicator,
    toggleFullscreen,
    toggleMute,
    togglePlay,
  ]);

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
        className="streamforge-video-player w-full max-h-full bg-black object-contain fullscreen:h-full cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={() => {
          handleTimeUpdate();
          handleProgress();
        }}
        onLoadedMetadata={() => {
          if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
            setMediaDuration(videoRef.current.duration);
          }
          if (videoRef.current && startTime > 0) {
            videoRef.current.currentTime = startTime;
            setCurrentTime(startTime);
            lastPlaybackPositionRef.current = startTime;
            lastSeekTimeRef.current = startTime;
          }
          handleProgress();
        }}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onError={() => {
          setPlaybackError('Unable to load this video stream.');
          setIsLoading(false);
        }}
        onProgress={handleProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onSeeking={() => {
          handleSeeking();
          handleProgress();
        }}
        onSeeked={() => {
          handleSeeked();
          handleProgress();
        }}
        onEnded={handleEnded}
      >
        {captions.map((caption) => (
          <track
            key={caption.id}
            ref={(element) => {
              captionTrackRefs.current[caption.id] = element;
            }}
            kind="subtitles"
            label={caption.label}
            src={caption.src}
            srcLang={caption.srcLang}
            default={caption.isDefault}
          />
        ))}
      </video>

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
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent px-2 py-1 rounded bg-transparent border-0 cursor-pointer transition-colors"
            >
              Close
              <Kbd>B</Kbd>
            </button>
          </div>

          <div className="space-y-3 border-b border-border/60 px-4 py-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">Add bookmark at {formatTime(currentTime)}</p>
              <p className="text-[10px] text-muted-foreground">Save the current position with a note.</p>
            </div>
            <input
              ref={bookmarkInputRef}
              placeholder="press / to type note"
              value={bookmarkTitle}
              onChange={(event) => setBookmarkTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
              className="w-full border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary rounded px-3 py-1.5 text-xs"
            />
            <button
              onClick={handleAddBookmark}
              disabled={isBookmarkSaving}
              className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isBookmarkSaving ? (
                'Saving...'
              ) : (
                <span className="inline-flex items-center gap-1">
                  Add bookmark
                  <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-normal opacity-85">
                    (<Kbd className="bg-primary-foreground/15 text-primary-foreground h-4 min-w-4 px-1 text-[9px]">Ctrl</Kbd>
                    <span>+</span>
                    <Kbd className="bg-primary-foreground/15 text-primary-foreground h-4 min-w-4 px-1 text-[9px]">Enter</Kbd>)
                  </span>
                </span>
              )}
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
        <div className="relative flex items-center px-0.5 w-full h-[5px] group/timeline">
          {/* Buffered ranges container */}
          <div className="absolute left-0.5 right-0.5 top-1/2 -translate-y-1/2 h-[3px] group-hover/timeline:h-[5px] transition-all pointer-events-none overflow-hidden rounded-full bg-white/10">
            {bufferedRanges.map((range, index) => (
              <div
                key={index}
                className="absolute top-0 bottom-0 bg-white/25 rounded-full"
                style={{
                  left: `${(range.start / displayDuration) * 100}%`,
                  width: `${((range.end - range.start) / displayDuration) * 100}%`,
                }}
              />
            ))}
          </div>
          <input
            ref={progressInputRef}
            type="range"
            min="0"
            max={displayDuration}
            step="any"
            onChange={handleProgressChange}
            className="h-[3px] hover:h-[5px] transition-all w-full cursor-pointer appearance-none rounded-full bg-transparent accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform relative z-10"
            style={{
              background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${progressPercent}%, transparent ${progressPercent}%, transparent 100%)`,
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

            {captions.length > 0 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Closed captions"
                    className={`h-8 w-8 rounded flex items-center justify-center transition-colors cursor-pointer bg-transparent border-0 ${
                      activeCaptionTrack
                        ? 'text-white bg-white/10'
                        : 'text-white/90 hover:text-white'
                    }`}
                    onClick={() => applyCaptionSelection(selectedCaptionId === null ? defaultCaptionId : null)}
                  >
                    <ClosedCaption className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="flex items-center gap-1.5 font-sans">
                  <span>Closed captions</span>
                  <Kbd>C</Kbd>
                </TooltipContent>
              </Tooltip>
            ) : null}

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
                    ref={settingsButtonRef}
                    className={`h-8 w-8 text-white/90 hover:text-white rounded flex items-center justify-center transition-colors cursor-pointer bg-transparent border-0 ${showSettings ? 'text-white bg-white/10' : ''}`}
                    onClick={() => {
                      setShowSettings((isOpen) => !isOpen);
                      setSettingsView('main');
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
                  ref={settingsMenuRef}
                  role="menu"
                  className="absolute bottom-9 right-0 z-30 w-48 overflow-hidden rounded border border-border/60 bg-card/90 backdrop-blur-md text-foreground shadow-xl p-1"
                >
                  {settingsView === 'main' ? (
                    <>
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
                      {captions.length > 0 ? (
                        <>
                          <div className="h-px bg-border/60 my-1" />
                          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                            Captions
                          </div>
                          <div className="space-y-0.5">
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-foreground hover:bg-accent focus:bg-accent focus:outline-none cursor-pointer font-mono bg-transparent border-0"
                              onClick={() => applyCaptionSelection(null)}
                            >
                              <span className={`size-1.5 rounded-full ${selectedCaptionId === null ? 'bg-primary' : 'bg-transparent'}`} />
                              Off
                            </button>
                            {captions.map((caption) => (
                              <button
                                key={caption.id}
                                type="button"
                                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-foreground hover:bg-accent focus:bg-accent focus:outline-none cursor-pointer font-mono bg-transparent border-0"
                                onClick={() => applyCaptionSelection(caption.id)}
                              >
                                <span className={`size-1.5 rounded-full ${selectedCaptionId === caption.id ? 'bg-primary' : 'bg-transparent'}`} />
                                {caption.label}
                              </button>
                            ))}
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs text-foreground hover:bg-accent focus:bg-accent focus:outline-none cursor-pointer bg-transparent border-0"
                              onClick={() => setSettingsView('captions')}
                            >
                              <span>Customize</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 px-1 py-1">
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded text-foreground hover:bg-accent"
                          onClick={() => setSettingsView('main')}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="text-xs font-semibold">Closed Captions</div>
                      </div>
                      <div className="h-px bg-border/60 my-1" />
                      <div className="space-y-3 px-2 py-1">
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Font Color</div>
                          <div className="flex flex-wrap gap-1.5">
                            {CAPTION_COLOR_OPTIONS.map((option) => (
                              <button
                                key={`font-${option.value}`}
                                type="button"
                                aria-label={option.label}
                                className={`h-5 w-5 rounded border ${captionFontColor === option.value ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                                style={{ backgroundColor: option.value }}
                                onClick={() => setCaptionFontColor(option.value)}
                              />
                            ))}
                            <label
                              className={`relative flex h-5 w-5 cursor-pointer items-center justify-center overflow-hidden rounded border bg-[conic-gradient(from_180deg_at_50%_50%,#ff5f6d_0deg,#ffc371_72deg,#47cf73_144deg,#4facfe_216deg,#8b5cf6_288deg,#ff5f6d_360deg)] ${
                                !CAPTION_COLOR_OPTIONS.some((option) => option.value === captionFontColor)
                                  ? 'border-primary ring-1 ring-primary'
                                  : 'border-border'
                              }`}
                              aria-label="Custom font color"
                            >
                              <input
                                type="color"
                                value={captionFontColor}
                                onChange={(event) => setCaptionFontColor(event.target.value)}
                                className="absolute inset-0 cursor-pointer opacity-0"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                            <span>Font Size</span>
                            <span>{Math.round(captionFontSize * 10)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.9"
                            max="3"
                            step="0.05"
                            value={captionFontSize}
                            onChange={(event) => setCaptionFontSize(Number(event.target.value))}
                            className="w-full accent-primary"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                            <span>Font Opacity</span>
                            <span>{Math.round(captionFontOpacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.2"
                            max="1"
                            step="0.05"
                            value={captionFontOpacity}
                            onChange={(event) => setCaptionFontOpacity(Number(event.target.value))}
                            className="w-full accent-primary"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Background Color</div>
                          <div className="flex flex-wrap gap-1.5">
                            {CAPTION_COLOR_OPTIONS.map((option) => (
                              <button
                                key={`bg-${option.value}`}
                                type="button"
                                aria-label={option.label}
                                className={`h-5 w-5 rounded border ${captionBackgroundColor === option.value ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                                style={{ backgroundColor: option.value }}
                                onClick={() => setCaptionBackgroundColor(option.value)}
                              />
                            ))}
                            <label
                              className={`relative flex h-5 w-5 cursor-pointer items-center justify-center overflow-hidden rounded border bg-[conic-gradient(from_180deg_at_50%_50%,#ff5f6d_0deg,#ffc371_72deg,#47cf73_144deg,#4facfe_216deg,#8b5cf6_288deg,#ff5f6d_360deg)] ${
                                !CAPTION_COLOR_OPTIONS.some((option) => option.value === captionBackgroundColor)
                                  ? 'border-primary ring-1 ring-primary'
                                  : 'border-border'
                              }`}
                              aria-label="Custom background color"
                            >
                              <input
                                type="color"
                                value={captionBackgroundColor}
                                onChange={(event) => setCaptionBackgroundColor(event.target.value)}
                                className="absolute inset-0 cursor-pointer opacity-0"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                            <span>Background Opacity</span>
                            <span>{Math.round(captionBackgroundOpacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={captionBackgroundOpacity}
                            onChange={(event) => setCaptionBackgroundOpacity(Number(event.target.value))}
                            className="w-full accent-primary"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                            Text shadow
                          </div>
                          <Switch
                            checked={captionTextShadowEnabled}
                            onCheckedChange={setCaptionTextShadowEnabled}
                          />
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            className="w-full rounded px-2 py-1.5 text-left text-xs text-foreground hover:bg-accent focus:bg-accent focus:outline-none cursor-pointer bg-transparent border-0"
                            onClick={resetCaptionPreferences}
                          >
                            Reset Caption Styles
                          </button>
                        </div>
                      </div>
                    </>
                  )}
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

      <style jsx global>{`
        .streamforge-video-player::cue {
          color: rgba(${hexToRgbString(captionFontColor)}, ${captionFontOpacity});
          font-size: min(${captionFontSize}vw, ${captionFontSize * 1.4}vh);
          background-color: rgba(${hexToRgbString(captionBackgroundColor)}, ${captionBackgroundOpacity});
          text-shadow: ${captionTextShadowEnabled ? '0 1px 2px rgba(0, 0, 0, 0.9)' : 'none'};
        }

        .streamforge-video-player::-webkit-media-text-track-display {
          transform: translateY(-1vh);
        }

        :fullscreen .streamforge-video-player::-webkit-media-text-track-display {
          transform: translateY(-1.5vh);
        }
      `}</style>
    </div>
  );
};
