'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, ChevronDown, ChevronUp, Download, Captions, FileAudio } from 'lucide-react';
import {
  TranscriptChunk,
  TranscriptSearchResult,
  VideoTranscription,
} from '@/features/videos/types';
import {
  formatTranscriptTimestamp,
  getTranscriptChunkLabel,
  getTranscriptionLanguageLabel,
  normalizeTranscriptionStatus,
} from '@/features/videos/lib/transcriptions';
import { cn } from '@/shared/lib/utils';

type TranscriptPanelProps = {
  title: string;
  transcriptions: VideoTranscription[];
  selectedTranscriptionId: string | null;
  onSelectTranscription: (transcriptionId: string) => void;
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
  onOpenChange: (open: boolean) => void;
  canRequestTranscription?: boolean;
  onRequestTranscription?: () => void;
  isRequestingTranscription?: boolean;
};

const getStatusLabel = (transcription: VideoTranscription) => {
  const normalized = normalizeTranscriptionStatus(transcription);
  if (normalized === 'success') {
    return 'Completed';
  }

  if (normalized === 'failure') {
    return 'Failed';
  }

  return transcription.liveStatus?.stage || transcription.liveStatus?.status || transcription.status || 'Processing';
};

export function TranscriptPanel({
  title,
  transcriptions,
  selectedTranscriptionId,
  onSelectTranscription,
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
  onOpenChange,
  canRequestTranscription = false,
  onRequestTranscription,
  isRequestingTranscription = false,
}: TranscriptPanelProps) {
  const selectedTranscription =
    transcriptions.find((transcription) => transcription.id === selectedTranscriptionId) ?? null;
  const selectedStatus = selectedTranscription ? normalizeTranscriptionStatus(selectedTranscription) : null;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Captions className="h-4 w-4 text-primary" />
              Transcript
            </CardTitle>
            <CardDescription>
              Timestamp-linked transcript rows and caption artifact downloads for {title}.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canRequestTranscription && onRequestTranscription ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={onRequestTranscription}
                disabled={isRequestingTranscription}
              >
                {isRequestingTranscription ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileAudio className="h-3.5 w-3.5" />}
                Request transcription
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="ghost" className="gap-2" onClick={() => onOpenChange(!isOpen)}>
              {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {isOpen ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>

        {transcriptions.length > 0 ? (
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Select value={selectedTranscriptionId ?? undefined} onValueChange={onSelectTranscription}>
              <SelectTrigger className="md:max-w-sm">
                <SelectValue placeholder="Select transcript" />
              </SelectTrigger>
              <SelectContent>
                {transcriptions.map((transcription) => (
                  <SelectItem key={transcription.id} value={transcription.id}>
                    {getTranscriptionLanguageLabel(transcription.language)} · {(transcription.format ?? 'TXT').toUpperCase()} · {getStatusLabel(transcription)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedTranscription ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {(selectedTranscription.format ?? 'TXT').toUpperCase()}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  {getTranscriptionLanguageLabel(selectedTranscription.language)}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono',
                    selectedStatus === 'success' && 'border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300',
                    selectedStatus === 'failure' && 'border-destructive/25 bg-destructive/10 text-destructive',
                    selectedStatus === 'active' && 'border-primary/25 bg-primary/10 text-primary'
                  )}
                >
                  {getStatusLabel(selectedTranscription)}
                </Badge>
                {selectedStatus === 'success' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => onDownloadTranscription(selectedTranscription)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardHeader>

      {isOpen ? (
        <CardContent className="space-y-4">
          {transcriptions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No transcription artifacts are available for this video yet.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
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
                    className="pl-8"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={onTranscriptSearch}
                  disabled={isTranscriptSearching || transcriptSearchQuery.trim().length === 0}
                >
                  {isTranscriptSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  Search
                </Button>
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
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <p className="text-xs font-semibold text-foreground">Transcript rows</p>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {transcriptChunks.length}
                  </span>
                </div>
                <div className="max-h-[30rem] overflow-y-auto">
                  {isTranscriptLoading ? (
                    <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading transcript…
                    </div>
                  ) : transcriptChunks.length > 0 ? (
                    transcriptChunks.map((chunk) => (
                      <button
                        key={chunk.chunkId}
                        type="button"
                        className={cn(
                          'flex w-full gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/60',
                          highlightedChunkId === chunk.chunkId && 'bg-primary/10'
                        )}
                        onClick={() => onChunkSeek(chunk)}
                      >
                        <span className="min-w-14 font-mono text-[11px] text-primary">
                          {formatTranscriptTimestamp(chunk.startSeconds)}
                        </span>
                        <span className="text-sm leading-6 text-foreground">
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
