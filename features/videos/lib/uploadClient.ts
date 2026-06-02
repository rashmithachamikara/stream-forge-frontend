import { StreamForgeUploadClient } from '@streamforge/js-sdk';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.streamforge.local';

const normalizeApiBaseUrl = (url: string) => url.replace(/\/+$/, '');

export const createVideoUploadClient = (accessToken?: string | null) => {
  return new StreamForgeUploadClient({
    baseUrl: normalizeApiBaseUrl(API_BASE_URL),
    accessToken: accessToken ?? undefined,
  });
};
