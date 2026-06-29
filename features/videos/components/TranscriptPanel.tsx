'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, Search, Download, X } from 'lucide-react';
import {
  TranscriptChunk,
  TranscriptSearchResult,
  VideoTranscription,
} from '@/features/videos/types';
import {
  formatTranscriptTimestamp,
  getTranscriptChunkLabel,
  normalizeTranscriptionStatus,
} from '@/features/videos/lib/transcriptions';
import { cn } from '@/shared/lib/utils';

type TranscriptPanelProps = {
  transcriptions: VideoTranscription[];
  selectedTranscriptionId: string | null;
  transcriptChunks: TranscriptChunk[];
  isTranscriptLoading: boolean;
  transcriptSearchQuery: string;
  onTranscriptSearchQueryChange: (value: string) => void;
  onTranscriptSearch: () => void;
  transcriptSearchResults: TranscriptSearchResult[];
  isTranscriptSearching: boolean;
  highlightedChunkId: string | null;
  onChunkSeek: (chunk: Pick<TranscriptChunk, 'chunkId' | 'startSeconds'>) => void;
  onSearchResultSeek: (result: TranscriptSearchResult) => void;
  onDownloadTranscription: (transcription: VideoTranscription) => void;
  isOpen: boolean;
  onClose: () => void;
  currentPlaybackTime: number;
};

const TRANSCRIPT_AUTOSCROLL_STORAGE_KEY = 'streamforge_transcript_autoscroll';

export function TranscriptPanel({
  transcriptions,
  selectedTranscriptionId,
  transcriptChunks,
  isTranscriptLoading,
  transcriptSearchQuery,
  onTranscriptSearchQueryChange,
  onTranscriptSearch,
  transcriptSearchResults,
  isTranscriptSearching,
  highlightedChunkId,
  onChunkSeek,
  onSearchResultSeek,
  onDownloadTranscription,
  isOpen,
  onClose,
  currentPlaybackTime,
}: TranscriptPanelProps) {
  const [autoScroll, setAutoScroll] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.localStorage.getItem(TRANSCRIPT_AUTOSCROLL_STORAGE_KEY) !== 'false';
  });
  const [manualHighlightChunkId, setManualHighlightChunkId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const selectedTranscription =
    transcriptions.find((transcription) => transcription.id === selectedTranscriptionId) ?? null;
  const selectedStatus = selectedTranscription ? normalizeTranscriptionStatus(selectedTranscription) : null;
  const downloadableTranscription =
    selectedStatus === 'success'
      ? selectedTranscription
      : transcriptions.find((transcription) => normalizeTranscriptionStatus(transcription) === 'success') ?? null;
  const activeChunkId = useMemo(() => {
    const activeChunk = transcriptChunks.find(
      (chunk) =>
        currentPlaybackTime >= chunk.startSeconds &&
        currentPlaybackTime < chunk.endSeconds
    );

    return activeChunk?.chunkId ?? null;
  }, [currentPlaybackTime, transcriptChunks]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(TRANSCRIPT_AUTOSCROLL_STORAGE_KEY, String(autoScroll));
  }, [autoScroll]);

  useEffect(() => {
    setManualHighlightChunkId(highlightedChunkId);
  }, [highlightedChunkId]);

  useEffect(() => {
    if (!autoScroll || !activeChunkId) {
      return;
    }

    const container = scrollContainerRef.current;
    const row = rowRefs.current[activeChunkId];

    if (!container || !row) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const nextScrollTop =
      container.scrollTop +
      (rowRect.top - containerRect.top) -
      container.clientHeight / 2 +
      rowRect.height / 2;

    container.scrollTo({
      top: Math.max(0, nextScrollTop),
      behavior: 'smooth',
    });
  }, [activeChunkId, autoScroll]);

  useEffect(() => {
    if (!autoScroll || !activeChunkId) {
      return;
    }

    setManualHighlightChunkId((current) =>
      current && current !== activeChunkId ? null : current
    );
  }, [activeChunkId, autoScroll]);

  return (
    <Card>
      {isOpen ? (
        <CardContent className="space-y-4">
          {transcriptions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No transcription artifacts are available for this video yet.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Transcript</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-mono">Autoscroll</span>
                    <Switch
                      checked={autoScroll}
                      onCheckedChange={setAutoScroll}
                      className="scale-75 origin-left"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={onClose}
                    aria-label="Close transcript"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={transcriptSearchQuery}
                    onChange={(event) => onTranscriptSearchQueryChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        onTranscriptSearch();
                      }
                    }}
                    placeholder="Search transcript"
                    className="h-8 pl-7 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {isTranscriptSearching ? (
                    <div className="flex items-center gap-1 px-1.5 text-[10px] text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  ) : null}
                  {downloadableTranscription ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      onClick={() => onDownloadTranscription(downloadableTranscription)}
                      aria-label="Download transcript"
                      title="Download transcript"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  ) : null}
                </div>
              </div>

              {transcriptSearchQuery.trim().length > 0 ? (
                <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-foreground">Search results</p>
                    {isTranscriptSearching ? (
                      <span className="text-[11px] text-muted-foreground">Searching…</span>
                    ) : (
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {transcriptSearchResults.length} matches
                      </span>
                    )}
                  </div>
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {transcriptSearchResults.length > 0 ? (
                      transcriptSearchResults.map((result) => (
                        <button
                          key={`${result.transcriptionId}-${result.chunkId}`}
                          type="button"
                          className="w-full rounded-md border bg-background px-3 py-2 text-left transition-colors hover:bg-accent"
                          onClick={() => onSearchResultSeek(result)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-mono text-[11px] text-primary">
                              {formatTranscriptTimestamp(result.startSeconds)}
                            </span>
                            <span className="line-clamp-2 flex-1 text-xs text-foreground">
                              {result.content?.trim() || 'Transcript match'}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No matches found.</p>
                    )}
                  </div>
                </div>
              ) : null}

              {selectedStatus === 'failure' ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  {selectedTranscription?.failureReason || 'Transcript generation failed for this artifact.'}
                </div>
              ) : selectedStatus === 'active' && transcriptChunks.length === 0 && !isTranscriptLoading ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
                  Transcript generation is still in progress. Rows will appear here once chunks are ready.
                </div>
              ) : null}

              <div className="rounded-lg border">
                <div ref={scrollContainerRef} className="max-h-[30rem] overflow-y-auto">
                  {isTranscriptLoading ? (
                    <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading transcript…
                    </div>
                  ) : transcriptChunks.length > 0 ? (
                    transcriptChunks.map((chunk) => (
                      <button
                        key={chunk.chunkId}
                        ref={(element) => {
                          rowRefs.current[chunk.chunkId] = element;
                        }}
                        type="button"
                        className={cn(
                          'flex w-full cursor-pointer gap-2.5 border-b px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-accent/60',
                          activeChunkId === chunk.chunkId && 'bg-primary/15',
                          manualHighlightChunkId === chunk.chunkId &&
                            activeChunkId !== chunk.chunkId &&
                            autoScroll &&
                            'bg-primary/10'
                        )}
                        onClick={() => onChunkSeek(chunk)}
                      >
                        <span className="min-w-12 font-mono text-[10px] text-primary">
                          {formatTranscriptTimestamp(chunk.startSeconds)}
                        </span>
                        <span className="text-xs leading-5 text-foreground">
                          {getTranscriptChunkLabel(chunk)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-sm text-muted-foreground">
                      No transcript rows available for the selected artifact.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}
