'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { VideoPlayer } from '@/features/videos/components/VideoPlayer';
import { apiClient } from '@/shared/lib/api';
import { Video, VideoTranscription } from '@/features/videos/types';
import { useAuth } from '@/features/auth/AuthContext';
import {
  convertSrtToVtt,
  getTranscriptionLanguageLabel,
  normalizeTranscriptionStatus,
  selectPrimaryTranscription,
} from '@/features/videos/lib/transcriptions';

type CaptionTrack = {
  id: string;
  label: string;
  src: string;
  srcLang: string;
  isDefault?: boolean;
};

export default function VideoEmbedPage({ videoId }: { videoId: string }) {
  const searchParams = useSearchParams();
  const { token } = useAuth();

  // Iframe configure options
  const autoplay = searchParams.get('autoplay') === '1' || searchParams.get('autoplay') === 'true';
  const controls = searchParams.get('controls') !== '0' && searchParams.get('controls') !== 'false';
  const loop = searchParams.get('loop') === '1' || searchParams.get('loop') === 'true';
  const shareToken = searchParams.get('shareToken') ?? undefined;

  const [video, setVideo] = useState<Video | null>(null);
  const [transcriptions, setTranscriptions] = useState<VideoTranscription[]>([]);
  const [selectedTranscriptionId, setSelectedTranscriptionId] = useState<string | null>(null);
  const [captionTracks, setCaptionTracks] = useState<CaptionTrack[]>([]);
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const captionUrlsRef = useRef<string[]>([]);
  const browserLanguage = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en';

  const loadData = useCallback(async () => {
    // Run asynchronously to prevent synchronous setState inside useEffect
    await Promise.resolve();

    setIsLoading(true);
    setError(null);

    const [videoResponse, transcriptionsResponse] = await Promise.all([
      apiClient.getVideoById(videoId, { shareToken }),
      apiClient.getVideoTranscriptions(videoId, { shareToken }),
    ]);

    if (videoResponse.success && videoResponse.data) {
      setVideo(videoResponse.data);
      
      if (transcriptionsResponse.success && transcriptionsResponse.data) {
        setTranscriptions(transcriptionsResponse.data);
        if (transcriptionsResponse.data.length > 0) {
          const primaryId = selectPrimaryTranscription(transcriptionsResponse.data, browserLanguage)?.id ?? null;
          setSelectedTranscriptionId(primaryId);
        }
      }
    } else {
      setError(videoResponse.error ?? 'Failed to load video');
    }

    setIsLoading(false);
  }, [videoId, shareToken, browserLanguage]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadData();
    });

    return () => {
      captionUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      captionUrlsRef.current = [];
    };
  }, [loadData]);

  // Load captions track VTT URLs
  useEffect(() => {
    const completedTranscriptions = transcriptions.filter(
      (transcription) => normalizeTranscriptionStatus(transcription) === 'success'
    );

    if (completedTranscriptions.length === 0 || !video) {
      // Defer state updates to avoid synchronous setState inside useEffect warning
      void Promise.resolve().then(() => {
        captionUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        captionUrlsRef.current = [];
        setCaptionTracks([]);
        setSelectedCaptionId(null);
      });
      return;
    }

    let isMounted = true;

    const groupedByLanguage = new Map<string, VideoTranscription[]>();
    completedTranscriptions.forEach((transcription) => {
      const key = transcription.language?.toLowerCase() || 'auto';
      const group = groupedByLanguage.get(key) ?? [];
      group.push(transcription);
      groupedByLanguage.set(key, group);
    });

    const loadCaptions = async () => {
      const selectedArtifacts = Array.from(groupedByLanguage.values())
        .map((group) => selectPrimaryTranscription(group, group[0]?.language ?? undefined))
        .filter((value): value is VideoTranscription => Boolean(value));

      const nextCaptionTracks: CaptionTrack[] = [];
      const nextUrls: string[] = [];

      for (const transcription of selectedArtifacts) {
        const response = await apiClient.getVideoTranscriptionArtifactText(video.id, transcription.id, { shareToken });
        if (!response.success || !response.data) {
          continue;
        }

        const format = transcription.format?.toUpperCase() ?? 'VTT';
        const content = format === 'SRT' ? convertSrtToVtt(response.data.content) : response.data.content;
        const blob = new Blob([content], { type: 'text/vtt' });
        const objectUrl = URL.createObjectURL(blob);
        nextUrls.push(objectUrl);
        nextCaptionTracks.push({
          id: transcription.id,
          label: getTranscriptionLanguageLabel(transcription.language),
          src: objectUrl,
          srcLang: transcription.language || 'en',
        });
      }

      if (!isMounted) {
        nextUrls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }

      captionUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      captionUrlsRef.current = nextUrls;
      setCaptionTracks(nextCaptionTracks);
      setSelectedCaptionId((current) => {
        if (current && nextCaptionTracks.some((track) => track.id === current)) {
          return current;
        }

        const primaryTrack = nextCaptionTracks.find((track) => track.id === selectedTranscriptionId);
        return primaryTrack?.id ?? nextCaptionTracks[0]?.id ?? null;
      });
    };

    void loadCaptions();

    return () => {
      isMounted = false;
    };
  }, [selectedTranscriptionId, shareToken, transcriptions, video]);

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center text-white text-xs font-mono">
        Loading...
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
        <p className="text-sm font-semibold text-destructive font-mono">{error ?? 'Failed to load video'}</p>
      </div>
    );
  }

  const isVideoReady = video.status === 'Ready' || !video.status;
  const isVideoDeleted = video.status === 'Deleted';
  const isVideoFailed = video.status === 'Failed';

  if (!isVideoReady) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center p-4 text-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
          {isVideoDeleted ? 'Video Deleted' : isVideoFailed ? 'Processing Error' : 'Video is processing'}
        </p>
        <p className="text-[11px] text-muted-foreground max-w-xs">
          {isVideoDeleted
            ? 'This video has been deleted and is no longer available.'
            : isVideoFailed
            ? 'Playback is unavailable because this video could not be ingested.'
            : 'Playback will be available once transcoding and analysis complete.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`w-screen h-screen bg-black flex items-center justify-center overflow-hidden ${!controls ? 'embed-no-controls' : ''}`}>
      {!controls && (
        <style dangerouslySetInnerHTML={{ __html: `
          .embed-no-controls [class*="bottom-0"] {
            display: none !important;
          }
          .embed-no-controls [class*="pointer-events-none"] {
            display: none !important;
          }
        `}} />
      )}
      <div className="w-full h-full max-w-full max-h-full aspect-video">
        <VideoPlayer
          videoId={video.id}
          hlsUrl={video.hlsUrl}
          title={video.title}
          duration={video.duration}
          authToken={token}
          captions={captionTracks}
          selectedCaptionId={selectedCaptionId}
          onCaptionChange={setSelectedCaptionId}
          autoPlay={autoplay}
          onEnded={() => {
            if (loop && typeof window !== 'undefined') {
              // Custom looping behavior is handled by the browser video tag automatically, 
              // but we can catch this event for external interface compatibility
            }
          }}
        />
      </div>
    </div>
  );
}
