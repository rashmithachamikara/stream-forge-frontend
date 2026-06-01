export interface Playlist {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  videoIds: string[];
  isPublic: boolean;
}
