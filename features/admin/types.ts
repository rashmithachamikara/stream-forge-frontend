export interface ViewAnalytics {
  videoId: string;
  date: Date;
  views: number;
}

export interface VideoAnalytics {
  videoId: string;
  title: string;
  views: number;
  avgWatchTime: number;
  completionRate: number;
}
