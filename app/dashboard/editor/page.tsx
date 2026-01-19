'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Upload, Play, Eye, Edit2, Trash2, Code, Copy, Check } from 'lucide-react';
import { Video } from '@/types';
import Image from 'next/image';

export default function EditorDashboard() {
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [copied, setCopied] = useState(false);
  const [embedWidth, setEmbedWidth] = useState('560');
  const [embedHeight, setEmbedHeight] = useState('315');
  const [autoplay, setAutoplay] = useState(false);
  const [controls, setControls] = useState(true);
  const [loop, setLoop] = useState(false);
  
  const [videos, setVideos] = useState<Video[]>([
    {
      id: '1',
      title: 'Getting Started with Stream Forge',
      description: 'Learn the basics of our platform',
      thumbnail: '/thumbnail-onboarding.svg',
      duration: 600,
      uploadedBy: 'Jane Editor',
      uploadedAt: new Date('2024-02-15'),
      views: 234,
      categories: ['Tutorial', 'Onboarding'],
      tags: ['intro', 'basics'],
      visibility: 'public',
      hlsUrl: 'https://example.com/hls/video1.m3u8',
      transcodedVersions: [
        { resolution: '1080p', format: 'H.264', bitrate: '5000kbps', url: 'https://example.com/1080p' },
        { resolution: '720p', format: 'H.264', bitrate: '2500kbps', url: 'https://example.com/720p' },
      ],
    },
    {
      id: '2',
      title: 'Advanced Features Tour',
      description: 'Explore advanced features',
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
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleEmbed = (video: Video) => {
    setSelectedVideo(video);
    setEmbedDialogOpen(true);
    setCopied(false);
  };

  const getEmbedCode = (video: Video) => {
    const params = [];
    if (autoplay) params.push('autoplay=1');
    if (!controls) params.push('controls=0');
    if (loop) params.push('loop=1');
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    
    return `<iframe 
  width="${embedWidth}" 
  height="${embedHeight}" 
  src="${window.location.origin}/embed/${video.id}${queryString}" 
  frameborder="0" 
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
  allowfullscreen>
</iframe>`;
  };

  const copyToClipboard = () => {
    if (selectedVideo) {
      navigator.clipboard.writeText(getEmbedCode(selectedVideo));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stats = [
    { label: 'Total Videos', value: videos.length },
    { label: 'Total Views', value: videos.reduce((sum, v) => sum + v.views, 0) },
    { label: 'Total Duration', value: formatDuration(videos.reduce((sum, v) => sum + v.duration, 0)) },
  ];

  return (
    <DashboardLayout title="Editor Dashboard" requiredRoles={['editor']}>
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Videos List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Your Videos</CardTitle>
              <CardDescription>Manage and organize your uploaded videos</CardDescription>
            </div>
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Video
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Search your videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="relative aspect-video bg-muted">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-90 transition-opacity drop-shadow-lg" />
                      </div>
                      <Badge className="absolute top-2 right-2 bg-black/80 text-white">
                        {formatDuration(video.duration)}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2">{video.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                        {video.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.views} views
                        </span>
                        <span>{video.uploadedAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEmbed(video)}>
                          <Code className="w-3 h-3" />
                          Embed
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredVideos.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No videos found</p>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Upload Your First Video
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Embed Dialog */}
      <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
        <DialogContent className="bg-background border border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Embed Video</DialogTitle>
            <DialogDescription>
              Configure and copy the embed code for your website
            </DialogDescription>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Video Title</label>
                <p className="text-sm text-muted-foreground">{selectedVideo.title}</p>
              </div>

              <Tabs defaultValue="code" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="configure">Configure</TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Embed Code</label>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-64 whitespace-pre-wrap break-all">
                        <code>{getEmbedCode(selectedVideo)}</code>
                      </pre>
                    </div>
                  </div>
                  <Button 
                    onClick={copyToClipboard} 
                    className="w-full gap-2"
                    variant={copied ? "secondary" : "default"}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="configure" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="width">Width (px)</Label>
                        <Input
                          id="width"
                          type="number"
                          value={embedWidth}
                          onChange={(e) => setEmbedWidth(e.target.value)}
                          placeholder="560"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">Height (px)</Label>
                        <Input
                          id="height"
                          type="number"
                          value={embedHeight}
                          onChange={(e) => setEmbedHeight(e.target.value)}
                          placeholder="315"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="autoplay">Autoplay</Label>
                          <p className="text-xs text-muted-foreground">Start playing automatically</p>
                        </div>
                        <Switch
                          id="autoplay"
                          checked={autoplay}
                          onCheckedChange={setAutoplay}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="controls">Show Controls</Label>
                          <p className="text-xs text-muted-foreground">Display video controls</p>
                        </div>
                        <Switch
                          id="controls"
                          checked={controls}
                          onCheckedChange={setControls}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="loop">Loop</Label>
                          <p className="text-xs text-muted-foreground">Replay video continuously</p>
                        </div>
                        <Switch
                          id="loop"
                          checked={loop}
                          onCheckedChange={setLoop}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
