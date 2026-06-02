const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.streamforge.local';

const normalizeApiBaseUrl = (url: string) => url.replace(/\/+$/, '');

export const getVideoManifestUrl = (videoId: string) => {
  return `${normalizeApiBaseUrl(API_BASE_URL)}/api/v1/videos/${videoId}/playback/manifest`;
};

export const getVideoThumbnailUrl = (videoId: string) => {
  return `${normalizeApiBaseUrl(API_BASE_URL)}/api/v1/videos/${videoId}/thumbnail`;
};
