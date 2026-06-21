'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { useAuth } from '@/features/auth/AuthContext';
import { createVideoUploadClient } from '@/features/videos/lib/uploadClient';
import { apiClient } from '@/shared/lib/api';
import { Category, TagSummary } from '@/features/videos/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  Video,
  X,
  Check,
  CheckCircle,
  FileVideo,
  Settings,
  Eye,
  Lock,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface QualityOption {
  id: string;
  label: string;
  resolution: string;
  bitrate: string;
  enabled: boolean;
}

export default function UploadVideoPage() {
  const router = useRouter();
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<TagSummary[]>([]);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);

  // Video metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'Public' | 'Private' | 'Internal'>('Public');

  // Transcoding options
  const [qualityOptions, setQualityOptions] = useState<QualityOption[]>([
    { id: '1080p', label: '1080p Full HD', resolution: '1920x1080', bitrate: '5000kbps', enabled: true },
    { id: '720p', label: '720p HD', resolution: '1280x720', bitrate: '2500kbps', enabled: true },
    { id: '480p', label: '480p SD', resolution: '854x480', bitrate: '1200kbps', enabled: true },
    { id: '360p', label: '360p', resolution: '640x360', bitrate: '800kbps', enabled: false },
  ]);

  const [enableTranscript, setEnableTranscript] = useState(false);
  const [enableThumbnailGeneration, setEnableThumbnailGeneration] = useState(true);

  // Client-side local video metadata states
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoResolution, setVideoResolution] = useState<string | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadMetadata = async () => {
      setIsMetadataLoading(true);
      const [categoryResponse, tagResponse] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getTags(undefined, 1, 50),
      ]);

      if (!isMounted) {
        return;
      }

      if (categoryResponse.success && categoryResponse.data) {
        setAvailableCategories(categoryResponse.data);
      }

      if (tagResponse.success && tagResponse.data) {
        setAvailableTags(tagResponse.data.items);
      }

      setIsMetadataLoading(false);
    };

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, []);

  // Client-side local video metadata extraction
  useEffect(() => {
    if (!selectedFile) {
      setThumbnailUrl(null);
      setVideoDuration(null);
      setVideoResolution(null);
      setIsGeneratingThumbnail(false);
      return;
    }

    setIsGeneratingThumbnail(true);
    const url = URL.createObjectURL(selectedFile);

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    let isCleanedUp = false;

    const handleLoadedMetadata = () => {
      if (isCleanedUp) return;
      setVideoDuration(video.duration);
      setVideoResolution(`${video.videoWidth}x${video.videoHeight}`);
      
      // Calculate aspect ratio
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w && h) {
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
        const divisor = gcd(w, h);
        const ratioStr = `${w / divisor}:${h / divisor}`;
        const commonRatios: Record<string, string> = {
          '16:9': '16:9',
          '4:3': '4:3',
          '3:2': '3:2',
          '1:1': '1:1',
          '9:16': '9:16 (Vertical)',
          '16:10': '16:10',
          '21:9': '21:9 (Ultrawide)',
          '64:27': '21:9 (Ultrawide)',
        };
        setVideoAspectRatio(commonRatios[ratioStr] || ratioStr);
      }
      
      // Seek a little bit in to avoid black starting frame
      video.currentTime = Math.min(1, video.duration / 2);
    };

    const handleSeeked = () => {
      if (isCleanedUp) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setThumbnailUrl(dataUrl);
        }
      } catch (err) {
        console.error('Failed to generate local thumbnail:', err);
      } finally {
        setIsGeneratingThumbnail(false);
      }
    };

    const handleError = () => {
      if (isCleanedUp) return;
      console.error('Error loading video file for preview extraction');
      setIsGeneratingThumbnail(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    return () => {
      isCleanedUp = true;
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      
      // Stop the video element from active loading/decoding
      video.src = '';
      video.load();
      
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
    };
  }, [selectedFile]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setSelectedFile(null);
    setThumbnailUrl(null);
    setVideoDuration(null);
    setVideoResolution(null);
    setVideoAspectRatio(null);
    setIsGeneratingThumbnail(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getFileFormat = (file: File): string => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'mp4':
        return 'MP4';
      case 'mov':
      case 'qt':
        return 'QuickTime (MOV)';
      case 'webm':
        return 'WebM';
      case 'mkv':
        return 'MKV';
      case 'avi':
        return 'AVI';
      default:
        return ext ? ext.toUpperCase() : 'Unknown';
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((currentTagIds) =>
      currentTagIds.includes(tagId)
        ? currentTagIds.filter((currentTagId) => currentTagId !== tagId)
        : [...currentTagIds, tagId]
    );
  };

  const toggleQuality = (qualityId: string) => {
    setQualityOptions(
      qualityOptions.map((q) =>
        q.id === qualityId ? { ...q, enabled: !q.enabled } : q
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !title) {
      return;
    }

    if (!token) {
      setUploadError('You must be signed in to upload videos.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const client = createVideoUploadClient(token);

      const uploadResponse = await client.uploadFile({
        title,
        description: description || undefined,
        file: selectedFile,
        fileName: selectedFile.name,
        contentType: selectedFile.type || undefined,
        categoryId: selectedCategoryId ?? undefined,
        visibility,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        onProgress: (progress) => {
          setUploadProgress(progress.percent);
        },
      });

      setUploadProgress(100);
      setUploadedVideoId(uploadResponse.videoId);
      setUploadComplete(true);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setSelectedCategoryId(null);
    setSelectedTagIds([]);
    setVisibility('Public');
    setUploadProgress(0);
    setUploadComplete(false);
    setUploadError(null);
    setUploadedVideoId(null);
    setObjectUrl(null);
    setVideoDuration(null);
    setVideoResolution(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <DashboardLayout title="Upload Video">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Publishing</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Upload Video</h1>
        </div>

        {uploadComplete ? (
          /* Success State */
          <div className="max-w-md mx-auto text-center py-20">
            <div className="size-14 mx-auto bg-success/10 text-success rounded-full grid place-items-center mb-6">
              <Check className="size-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Upload complete</h1>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              “{title}” has been uploaded and is now being processed. You'll be notified when it's ready.
            </p>
            <div className="flex justify-center gap-2">
              <Button type="button" onClick={resetForm} variant="outline" className="h-8 text-xs px-4">
                Upload another
              </Button>
              <Button type="button" onClick={() => router.push(uploadedVideoId ? `/videos/${uploadedVideoId}` : '/videos')} className="bg-foreground text-background font-semibold hover:opacity-90 h-8 text-xs px-4">
                View video
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {uploadError && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
                className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-foreground/30 bg-card'
                }`}
              >
                <div className="size-12 mx-auto bg-muted rounded-full grid place-items-center mb-4">
                  <Upload className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">Drag and drop a video file</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse · MP4, MOV, AVI, WebM up to 5GB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-start">
                
                {/* Left Column: Video Information & Local Preview */}
                <div className="space-y-4 w-full max-w-[400px]">
                  
                  {/* Thumbnail Preview */}
                  <div className="aspect-video w-full max-w-[400px] rounded-lg bg-muted overflow-hidden relative ring-1 ring-border flex items-center justify-center">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt="Local video thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    ) : isGeneratingThumbnail ? (
                      <div className="text-center space-y-2 text-muted-foreground p-4">
                        <FileVideo className="size-8 mx-auto animate-pulse text-muted-foreground/60" />
                        <p className="text-[11px] font-mono uppercase tracking-wider">Generating preview...</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-2 text-muted-foreground p-4">
                        <FileVideo className="size-8 mx-auto text-muted-foreground/40" />
                        <p className="text-[11px] font-mono uppercase tracking-wider">No preview available</p>
                      </div>
                    )}

                    {/* Remove File Button Overlay */}
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={removeFile}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove video file"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>

                  {/* File Metadata Info */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Filename</span>
                      <span className="font-semibold text-foreground truncate max-w-[200px]" title={selectedFile.name}>
                        {selectedFile.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Format</span>
                      <span className="font-mono text-foreground">{getFileFormat(selectedFile)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Size</span>
                      <span className="font-mono text-foreground">{formatFileSize(selectedFile.size)}</span>
                    </div>
                    {videoDuration !== null && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Duration</span>
                        <span className="font-mono text-foreground">{formatDuration(videoDuration)}</span>
                      </div>
                    )}
                    {videoResolution && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Resolution</span>
                        <span className="font-mono text-foreground">{videoResolution}</span>
                      </div>
                    )}
                    {videoAspectRatio && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Aspect Ratio</span>
                        <span className="font-mono text-foreground">{videoAspectRatio}</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Progress Bar if Uploading */}
                  {isUploading && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Uploading Asset...</span>
                        <span className="font-mono">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-1.5 bg-muted" />
                    </div>
                  )}
                </div>

                {/* Right Column: Metadata Form & Settings */}
                <div className="space-y-6 w-full">
                  {/* Form Fields grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Title *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter video title"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    {/* Category */}
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Category</Label>
                      <Select
                        value={selectedCategoryId ?? 'none'}
                        onValueChange={(value) => setSelectedCategoryId(value === 'none' ? null : value)}
                        disabled={isMetadataLoading}
                      >
                        <SelectTrigger id="category" className="h-10 bg-muted border-0 focus:ring-1 focus:ring-ring">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No category</SelectItem>
                          {availableCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Visibility */}
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Visibility</Label>
                      <div className="flex bg-muted rounded-md p-1 w-full">
                        {([
                          { value: 'Public', label: 'Public', icon: Globe, desc: 'Anyone can view this video' },
                          { value: 'Internal', label: 'Internal', icon: Eye, desc: 'Only users on this platform can view' },
                          { value: 'Private', label: 'Private', icon: Lock, desc: 'Only you can view this video' },
                        ] as const).map((opt) => {
                          const Icon = opt.icon;
                          const isActive = visibility === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setVisibility(opt.value)}
                              className={cn(
                                "flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-md transition-all duration-150 cursor-pointer text-center",
                                isActive
                                  ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <div className="flex items-center gap-1.5">
                                <Icon className="size-3.5" />
                                <span className="text-xs font-semibold">{opt.label}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground hidden sm:inline mt-0.5">{opt.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Tags</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {availableTags.length > 0 ? (
                          availableTags.map((tag) => {
                            const isSelected = selectedTagIds.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                disabled={isMetadataLoading}
                                onClick={() => toggleTag(tag.id)}
                                className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full border transition-all duration-150 cursor-pointer",
                                  isSelected
                                    ? "bg-foreground text-background border-foreground font-medium"
                                    : "border-border text-muted-foreground hover:border-foreground/40"
                                )}
                              >
                                {tag.name}
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {isMetadataLoading ? 'Loading tags...' : 'No tags available'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Transcoding Qualities */}
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Transcoding qualities</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {qualityOptions.map((q) => {
                          const isSelected = q.enabled;
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => toggleQuality(q.id)}
                              className={cn(
                                "text-xs px-3 py-1 rounded-md border font-mono transition-all duration-150 cursor-pointer",
                                isSelected
                                  ? "bg-foreground text-background border-foreground font-semibold"
                                  : "border-border hover:border-foreground/40 text-muted-foreground"
                              )}
                            >
                              {q.id}
                            </button>
                          );
                        })}
                      </div>
                      {qualityOptions.filter((q) => q.enabled).length === 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20 mt-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <p className="text-xs font-medium">
                            Please select at least one quality level
                          </p>
                        </div>
                      )}
                    </div>

                    {/* AI Toggles */}
                    <div className="md:col-span-2 space-y-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setEnableThumbnailGeneration(!enableThumbnailGeneration)}
                        className="w-full flex items-start gap-3 text-left p-3 rounded-md border border-border hover:bg-accent transition-colors cursor-pointer"
                      >
                        <div className={cn(
                          "mt-0.5 w-8 h-5 rounded-full relative shrink-0 transition-colors",
                          enableThumbnailGeneration ? "bg-foreground" : "bg-muted"
                        )}>
                          <div className={cn(
                            "absolute top-0.5 size-4 rounded-full bg-background transition-transform",
                            enableThumbnailGeneration ? "translate-x-3.5" : "translate-x-0.5"
                          )} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold">Auto-generate thumbnail</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">We'll select an optimal frame from the video.</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEnableTranscript(!enableTranscript)}
                        className="w-full flex items-start gap-3 text-left p-3 rounded-md border border-border hover:bg-accent transition-colors cursor-pointer"
                      >
                        <div className={cn(
                          "mt-0.5 w-8 h-5 rounded-full relative shrink-0 transition-colors",
                          enableTranscript ? "bg-foreground" : "bg-muted"
                        )}>
                          <div className={cn(
                            "absolute top-0.5 size-4 rounded-full bg-background transition-transform",
                            enableTranscript ? "translate-x-3.5" : "translate-x-0.5"
                          )} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold">Generate transcript with AI</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Automatic speech-to-text for searchability and accessibility.</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={isUploading}
                      className="h-8 text-xs px-4"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isUploading ||
                        !title ||
                        qualityOptions.filter((q) => q.enabled).length === 0
                      }
                      className="bg-foreground text-background font-semibold hover:opacity-90 disabled:opacity-50 h-8 text-xs px-4"
                    >
                      {isUploading ? `Uploading ${uploadProgress}%` : "Start upload"}
                    </Button>
                  </div>
                </div>

              </div>
            )}
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
