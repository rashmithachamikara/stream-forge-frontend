'use client';

import React, { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Video metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'restricted'>('public');

  // Transcoding options
  const [qualityOptions, setQualityOptions] = useState<QualityOption[]>([
    { id: '1080p', label: '1080p Full HD', resolution: '1920x1080', bitrate: '5000kbps', enabled: true },
    { id: '720p', label: '720p HD', resolution: '1280x720', bitrate: '2500kbps', enabled: true },
    { id: '480p', label: '480p SD', resolution: '854x480', bitrate: '1200kbps', enabled: true },
    { id: '360p', label: '360p', resolution: '640x360', bitrate: '800kbps', enabled: false },
  ]);

  const [enableTranscript, setEnableTranscript] = useState(false);
  const [enableThumbnailGeneration, setEnableThumbnailGeneration] = useState(true);

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

  const addCategory = () => {
    if (categoryInput.trim() && !categories.includes(categoryInput.trim())) {
      setCategories([...categories, categoryInput.trim()]);
      setCategoryInput('');
    }
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter((c) => c !== category));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
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

    setIsUploading(true);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    // In a real app, you would upload to your backend here
    // const formData = new FormData();
    // formData.append('video', selectedFile);
    // formData.append('title', title);
    // formData.append('description', description);
    // etc...
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setCategories([]);
    setTags([]);
    setVisibility('public');
    setUploadProgress(0);
    setUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <DashboardLayout title="Upload Video">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload New Video</h1>
          <p className="text-muted-foreground">
            Upload your video and configure transcoding options
          </p>
        </div>

        {uploadComplete ? (
          /* Success State */
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Upload Complete!</h3>
                  <p className="text-muted-foreground">
                    Your video has been uploaded successfully and is being processed.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={resetForm} variant="outline">
                    Upload Another Video
                  </Button>
                  <Button onClick={() => window.location.href = '/videos'}>
                    View All Videos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                      dragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
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
                            <Progress value={uploadProgress} className="h-2" />
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

                    {/* Categories */}
                    <div className="space-y-2">
                      <Label htmlFor="category">Categories</Label>
                      <div className="flex gap-2">
                        <Input
                          id="category"
                          value={categoryInput}
                          onChange={(e) => setCategoryInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                          placeholder="Add category (e.g., Tutorial, Training)"
                        />
                        <Button type="button" onClick={addCategory} variant="outline">
                          Add
                        </Button>
                      </div>
                      {categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {categories.map((category) => (
                            <Badge key={category} variant="secondary" className="gap-1">
                              {category}
                              <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() => removeCategory(category)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label htmlFor="tag">Tags</Label>
                      <div className="flex gap-2">
                        <Input
                          id="tag"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          placeholder="Add tags (e.g., intro, basics)"
                        />
                        <Button type="button" onClick={addTag} variant="outline">
                          Add
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="gap-1">
                              {tag}
                              <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() => removeTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Visibility */}
                    <div className="space-y-2">
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
                        <SelectTrigger id="visibility">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">
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
                          <SelectItem value="restricted">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              <div>
                                <div className="font-medium">Restricted</div>
                                <div className="text-xs text-muted-foreground">
                                  Only specific users can view
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
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
