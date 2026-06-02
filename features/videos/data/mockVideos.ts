import { Video } from '@/features/videos/types';
import { getVideoManifestUrl, getVideoThumbnailUrl } from '@/features/videos/lib/playbackUrls';

export const MOCK_VIDEO_IDS = [
  '89b4830e-55b3-4f50-b610-611514326e24',
  'ad93452d-0370-4ebc-ba2d-0b00f862d9bc',
] as const;

export const mockVideos: Video[] = [
  {
    id: MOCK_VIDEO_IDS[0],
    title: 'Tourists and bikes',
    description: 'Tourists getting frustrated and lost',
    thumbnail: getVideoThumbnailUrl(MOCK_VIDEO_IDS[0]),
    duration: 600,
    uploadedBy: 'Jane Editor',
    uploadedAt: new Date('2024-02-15'),
    views: 234,
    categories: ['Tutorial', 'Onboarding'],
    tags: ['intro', 'basics', 'getting-started'],
    visibility: 'public',
    hlsUrl: getVideoManifestUrl(MOCK_VIDEO_IDS[0]),
    transcodedVersions: [
      { resolution: '1080p', format: 'H.264', bitrate: '5000kbps', url: 'https://example.com/1080p' },
    ],
  },
  {
    id: MOCK_VIDEO_IDS[1],
    title: 'Attack on Titan',
    description: 'Attack on Titan anime series',
    thumbnail: getVideoThumbnailUrl(MOCK_VIDEO_IDS[1]),
    duration: 1200,
    uploadedBy: 'Jane Editor',
    uploadedAt: new Date('2024-02-10'),
    views: 156,
    categories: ['Tutorial'],
    tags: ['advanced', 'features'],
    visibility: 'public',
    hlsUrl: getVideoManifestUrl(MOCK_VIDEO_IDS[1]),
    transcodedVersions: [
      { resolution: '720p', format: 'H.264', bitrate: '2500kbps', url: 'https://example.com/720p' },
    ],
  },
];

export const mockEditorVideos: Video[] = mockVideos.slice(0, 2).map((video) => ({
  ...video,
  description:
    video.id === '1'
      ? 'Learn the basics of our platform'
      : 'Explore advanced features',
}));
