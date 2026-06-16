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
import { Switch } from '@/components/ui/switch';
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
  CheckCircle,
  FileVideo,
  Settings,
  Eye,
  Lock,
  Globe,
  AlertCircle,
} from 'lucide-react';

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <DashboardLayout title="Upload Video">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="mb-2 text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl">Upload video</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Add a source file, set visibility, and choose the playback qualities Stream Forge should prepare.
          </p>
        </div>

        {uploadComplete ? (
          /* Success State */
          <Card className="border-chart-3/30 bg-chart-3/10">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="mx-auto h-14 w-14 text-chart-3" />
                <div>
                  <h3 className="mb-2 text-2xl font-semibold tracking-[-0.025em] text-foreground">Upload received</h3>
                  <p className="text-muted-foreground">
                    Your video has been uploaded successfully and is being processed.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={resetForm} variant="outline">
                    Upload Another Video
                  </Button>
                  <Button onClick={() => router.push(uploadedVideoId ? `/videos/${uploadedVideoId}` : '/videos')}>
                    View Video
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {uploadError && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* File Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Select Video File
                </CardTitle>
                <CardDescription>
                  Upload a video file (MP4, MOV, AVI, WebM) - Maximum size: 5GB
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedFile ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`rounded-lg border border-dashed p-12 text-center transition-colors ${
                      dragActive
                        ? 'border-primary bg-accent/70'
                        : 'border-border bg-background/50 hover:border-primary/50'
                    }`}
                  >
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Drag and drop your video here
                    </h3>
                    <p className="text-muted-foreground mb-4">or</p>
                    <Button type="button" onClick={handleBrowseClick} variant="outline">
                      Browse Files
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="border border-border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <FileVideo className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1 truncate">
                          {selectedFile.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(selectedFile.size)} • {selectedFile.type}
                        </p>
                        {isUploading && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Uploading...</span>
                              <span className="text-sm text-muted-foreground">
                                {uploadProgress}%
                              </span>
                            </div>
                            <Progress value={uploadProgress} className="h-3 border border-border bg-muted" />
                          </div>
                        )}
                      </div>
                      {!isUploading && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={removeFile}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Details */}
            {selectedFile && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Video Details</CardTitle>
                    <CardDescription>
                      Provide information about your video
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter video title"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your video content..."
                        rows={4}
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={selectedCategoryId ?? 'none'}
                        onValueChange={(value) => setSelectedCategoryId(value === 'none' ? null : value)}
                        disabled={isMetadataLoading}
                      >
                        <SelectTrigger id="category">
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

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.length > 0 ? (
                          availableTags.map((tag) => (
                            <Button
                              key={tag.id}
                              type="button"
                              variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
                              size="sm"
                              disabled={isMetadataLoading}
                              onClick={() => toggleTag(tag.id)}
                            >
                              {tag.name}
                            </Button>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {isMetadataLoading ? 'Loading tags...' : 'No tags available'}
                          </p>
                        )}
                      </div>
                      {selectedTagIds.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedTagIds.map((tagId) => {
                            const tag = availableTags.find((availableTag) => availableTag.id === tagId);

                            return (
                              <Badge key={tagId} variant="outline" className="gap-1">
                                {tag?.name ?? tagId}
                                <button
                                  type="button"
                                  aria-label={`Remove ${tag?.name ?? 'tag'}`}
                                  className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                                  onClick={() => toggleTag(tagId)}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Visibility */}
                    <div className="space-y-2">
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select
                        value={visibility}
                        onValueChange={(value) => setVisibility(value as 'Public' | 'Private' | 'Internal')}
                      >
                        <SelectTrigger id="visibility">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Public">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              <div>
                                <div className="font-medium">Public</div>
                                <div className="text-xs text-muted-foreground">
                                  Anyone can view this video
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="Internal">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              <div>
                                <div className="font-medium">Internal</div>
                                <div className="text-xs text-muted-foreground">
                                  Only specific users can view
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="Private">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              <div>
                                <div className="font-medium">Private</div>
                                <div className="text-xs text-muted-foreground">
                                  Only you can view this video
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Transcoding Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Transcoding Options
                    </CardTitle>
                    <CardDescription>
                      Select which quality levels to generate for your video
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quality Selection */}
                    <div className="space-y-3">
                      <Label>Quality Levels</Label>
                      {qualityOptions.map((quality) => (
                        <div
                          key={quality.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{quality.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {quality.resolution} • {quality.bitrate}
                            </div>
                          </div>
                          <Switch
                            checked={quality.enabled}
                            onCheckedChange={() => toggleQuality(quality.id)}
                          />
                        </div>
                      ))}
                    </div>

                    {qualityOptions.filter((q) => q.enabled).length === 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-sm">
                          Please select at least one quality level
                        </p>
                      </div>
                    )}

                    {/* Additional Options */}
                    <div className="pt-4 border-t border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="thumbnail" className="text-base">
                            Auto-generate Thumbnails
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically create thumbnails from video frames
                          </p>
                        </div>
                        <Switch
                          id="thumbnail"
                          checked={enableThumbnailGeneration}
                          onCheckedChange={setEnableThumbnailGeneration}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="transcript" className="text-base">
                            Generate Transcript
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically transcribe audio to text
                          </p>
                        </div>
                        <Switch
                          id="transcript"
                          checked={enableTranscript}
                          onCheckedChange={setEnableTranscript}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isUploading ||
                      !title ||
                      qualityOptions.filter((q) => q.enabled).length === 0
                    }
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Uploading...' : 'Upload Video'}
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
