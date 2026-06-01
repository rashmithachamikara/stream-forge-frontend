export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  uploadedBy: string;
  uploadedAt: Date;
  views: number;
  categories: string[];
  tags: string[];
  visibility: 'public' | 'private' | 'restricted';
  hlsUrl: string;
  transcriptUrl?: string;
  transcodedVersions: TranscodedVersion[];
}

export interface TranscodedVersion {
  resolution: string;
  format: string;
  bitrate: string;
  url: string;
}
