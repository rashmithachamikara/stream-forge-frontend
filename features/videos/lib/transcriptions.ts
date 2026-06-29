import {
  TranscriptChunk,
  VideoTranscription,
  TranscriptionUiStatus,
} from '@/features/videos/types';

const ACTIVE_LIVE_STATUSES = new Set(['queued', 'running']);
const SUCCESS_LIVE_STATUSES = new Set(['completed']);
const FAILURE_LIVE_STATUSES = new Set(['failed']);

export const normalizeTranscriptionStatus = (
  transcription: Pick<VideoTranscription, 'status' | 'liveStatus'>
): TranscriptionUiStatus => {
  const persistedStatus = transcription.status;
  const liveStatus = transcription.liveStatus?.status?.toLowerCase() ?? null;

  if (
    persistedStatus === 'Completed' ||
    (liveStatus !== null && SUCCESS_LIVE_STATUSES.has(liveStatus))
  ) {
    return 'success';
  }

  if (
    persistedStatus === 'Failed' ||
    (liveStatus !== null && FAILURE_LIVE_STATUSES.has(liveStatus))
  ) {
    return 'failure';
  }

  if (
    persistedStatus === 'Pending' ||
    persistedStatus === 'Processing' ||
    (liveStatus !== null && ACTIVE_LIVE_STATUSES.has(liveStatus))
  ) {
    return 'active';
  }

  return 'active';
};

export const isActiveTranscription = (
  transcription: Pick<VideoTranscription, 'status' | 'liveStatus'>
) => normalizeTranscriptionStatus(transcription) === 'active';

export const getTranscriptionLanguageLabel = (language: string | null | undefined) => {
  if (!language) {
    return 'Auto';
  }

  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(language) ?? language.toUpperCase();
  } catch {
    return language.toUpperCase();
  }
};

const getFormatPriority = (format: string | null | undefined) => {
  if (!format) {
    return 99;
  }

  const normalized = format.toUpperCase();
  if (normalized === 'VTT') {
    return 0;
  }

  if (normalized === 'SRT') {
    return 1;
  }

  return 99;
};

const getStatusPriority = (transcription: VideoTranscription) => {
  const status = normalizeTranscriptionStatus(transcription);
  if (status === 'success') {
    return 0;
  }

  if (status === 'active') {
    return 1;
  }

  return 2;
};

export const selectPrimaryTranscription = (
  transcriptions: VideoTranscription[],
  preferredLanguage?: string | null
) => {
  const normalizedPreferredLanguage = preferredLanguage?.toLowerCase() ?? null;

  return [...transcriptions].sort((left, right) => {
    const leftPreferred = normalizedPreferredLanguage && left.language?.toLowerCase() === normalizedPreferredLanguage ? 0 : 1;
    const rightPreferred = normalizedPreferredLanguage && right.language?.toLowerCase() === normalizedPreferredLanguage ? 0 : 1;
    if (leftPreferred !== rightPreferred) {
      return leftPreferred - rightPreferred;
    }

    const statusPriority = getStatusPriority(left) - getStatusPriority(right);
    if (statusPriority !== 0) {
      return statusPriority;
    }

    const formatPriority = getFormatPriority(left.format) - getFormatPriority(right.format);
    if (formatPriority !== 0) {
      return formatPriority;
    }

    const updatedAtDiff =
      (right.updatedAt?.getTime() ?? 0) - (left.updatedAt?.getTime() ?? 0);
    if (updatedAtDiff !== 0) {
      return updatedAtDiff;
    }

    const createdAtDiff = right.createdAt.getTime() - left.createdAt.getTime();
    if (createdAtDiff !== 0) {
      return createdAtDiff;
    }

    return left.id.localeCompare(right.id);
  })[0] ?? null;
};

export const formatTranscriptTimestamp = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }

  return `${minutes}:${String(remainder).padStart(2, '0')}`;
};

export const getTranscriptChunkLabel = (chunk: Pick<TranscriptChunk, 'startSeconds' | 'content'>) =>
  chunk.content?.trim() || `Transcript at ${formatTranscriptTimestamp(chunk.startSeconds)}`;

export const buildTranscriptionDownloadName = (
  title: string,
  language: string | null | undefined,
  format: string | null | undefined
) => {
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'transcript';
  const languagePart = language?.toLowerCase() || 'auto';
  const extension = format?.toLowerCase() || 'txt';
  return `${safeTitle}-${languagePart}.${extension}`;
};

export const convertSrtToVtt = (content: string) => {
  const body = content
    .replace(/\r+/g, '')
    .replace(
      /(\d{2}:\d{2}:\d{2}),(\d{3})/g,
      (_match, timestamp, milliseconds) => `${timestamp}.${milliseconds}`
    );

  return `WEBVTT\n\n${body}`;
};
