import { Video } from '@/features/videos/types';

export const mockVideos: Video[] = [
  {
    id: '1',
    title: 'Getting Started with Stream Forge',
    description: 'Learn the basics of our platform in this comprehensive tutorial.',
    thumbnail: '/thumbnail-onboarding.svg',
    duration: 600,
    uploadedBy: 'Jane Editor',
    uploadedAt: new Date('2024-02-15'),
    views: 234,
    categories: ['Tutorial', 'Onboarding'],
    tags: ['intro', 'basics', 'getting-started'],
    visibility: 'public',
    hlsUrl: 'https://example.com/hls/video1.m3u8',
    transcodedVersions: [
      { resolution: '1080p', format: 'H.264', bitrate: '5000kbps', url: 'https://example.com/1080p' },
    ],
  },
  {
    id: '2',
    title: 'Advanced Features Tour',
    description: 'Explore the advanced features and capabilities of Stream Forge.',
    thumbnail: '/thumbnail-advanced.svg',
    duration: 1200,
    uploadedBy: 'Jane Editor',
    uploadedAt: new Date('2024-02-10'),
    views: 156,
    categories: ['Tutorial'],
    tags: ['advanced', 'features'],
    visibility: 'public',
    hlsUrl: 'https://example.com/hls/video2.m3u8',
    transcodedVersions: [
      { resolution: '720p', format: 'H.264', bitrate: '2500kbps', url: 'https://example.com/720p' },
    ],
  },
  {
    id: '3',
    title: 'Company Training Session',
    description: 'Q1 2024 company-wide training session.',
    thumbnail: '/thumbnail-training.svg',
    duration: 2400,
    uploadedBy: 'Jane Editor',
    uploadedAt: new Date('2024-02-05'),
    views: 89,
    categories: ['Training'],
    tags: ['company', 'training', 'q1'],
    visibility: 'public',
    hlsUrl: 'https://example.com/hls/video3.m3u8',
    transcodedVersions: [],
  },
  {
    id: '4',
    title: 'Product Demo',
    description: 'See our new features in action.',
    thumbnail: '/thumbnail-demo.svg',
    duration: 900,
    uploadedBy: 'Jane Editor',
    uploadedAt: new Date('2024-01-28'),
    views: 342,
    categories: ['Demo'],
    tags: ['product', 'demo', 'new-features'],
    visibility: 'public',
    hlsUrl: 'https://example.com/hls/video4.m3u8',
    transcodedVersions: [],
  },
];

export const mockEditorVideos: Video[] = mockVideos.slice(0, 2).map((video) => ({
  ...video,
  description:
    video.id === '1'
      ? 'Learn the basics of our platform'
      : 'Explore advanced features',
}));
