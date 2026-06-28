'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Cpu,
  KeyRound,
  Video,
  HardDrive,
  Shield,
  FileText,
  Copy,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  status: 'installed' | 'available' | 'installing';
  size: string;
  capabilities: string[];
}

interface APIKey {
  id: string;
  name: string;
  service: string;
  key: string;
  isActive: boolean;
  lastUsed?: string;
}

const SECTIONS = [
  { id: 'ai', label: 'AI & Transcription', icon: Cpu },
  { id: 'api', label: 'API Keys', icon: KeyRound },
  { id: 'processing', label: 'Video Processing', icon: Video },
  { id: 'storage', label: 'Storage & CDN', icon: HardDrive },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'audit', label: 'Audit Log', icon: FileText },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

export default function AdminSettingsPage() {
  const [active, setActive] = useState<SectionId>('ai');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});

  // AI Models State
  const [aiModels, setAiModels] = useState<AIModel[]>([
    {
      id: '1',
      name: 'Whisper Large V3',
      provider: 'OpenAI',
      status: 'installed',
      size: '1.5 GB',
      capabilities: ['Transcription', 'Translation'],
    },
    {
      id: '2',
      name: 'Wav2Vec 2.0',
      provider: 'Meta',
      status: 'available',
      size: '360 MB',
      capabilities: ['Transcription'],
    },
    {
      id: '3',
      name: 'Azure Speech',
      provider: 'Microsoft',
      status: 'installed',
      size: 'Cloud API',
      capabilities: ['Transcription', 'Translation', 'Speaker Recognition'],
    },
  ]);

  // API Keys State
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'OpenAI API',
      service: 'OpenAI',
      key: 'sk-proj-xxxxxxxxxxxxxxxxxxxxx',
      isActive: true,
      lastUsed: '2024-02-20',
    },
    {
      id: '2',
      name: 'Azure Speech Services',
      service: 'Azure',
      key: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
      isActive: true,
      lastUsed: '2024-02-19',
    },
  ]);

  const [newApiKey, setNewApiKey] = useState({ name: '', service: '', key: '' });
  const [showNewApiKeyForm, setShowNewApiKeyForm] = useState(false);

  // Video Settings State
  const [videoSettings, setVideoSettings] = useState({
    defaultQuality: '1080p',
    enableAutoTranscoding: true,
    enable1080p: true,
    enable720p: true,
    enable480p: true,
    enable360p: false,
    maxFileSize: '5',
    supportedFormats: ['mp4', 'mov', 'avi', 'webm'],
    enableThumbnailGeneration: true,
    thumbnailCount: '3',
    enableWatermark: false,
    watermarkPosition: 'bottom-right',
  });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    storageProvider: 'local',
    storagePath: '/var/stream-forge/videos',
    cdnEnabled: false,
    cdnUrl: '',
    maxConcurrentUploads: '3',
    maxConcurrentTranscodes: '2',
    enableAnalytics: true,
    retentionDays: '90',
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    requireMFA: false,
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    enableIPWhitelist: false,
    ipWhitelist: '',
    enableAuditLog: true,
    passwordMinLength: '8',
    requireSpecialChar: true,
  });

  const handleSaveSettings = () => {
    setSaveStatus('saving');
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleInstallModel = (modelId: string) => {
    setAiModels(
      aiModels.map((model) =>
        model.id === modelId ? { ...model, status: 'installing' as const } : model
      )
    );
    // Simulate installation
    setTimeout(() => {
      setAiModels(
        aiModels.map((model) =>
          model.id === modelId ? { ...model, status: 'installed' as const } : model
        )
      );
    }, 2000);
  };

  const handleUninstallModel = (modelId: string) => {
    setAiModels(
      aiModels.map((model) =>
        model.id === modelId ? { ...model, status: 'available' as const } : model
      )
    );
  };

  const handleAddApiKey = () => {
    if (newApiKey.name && newApiKey.service && newApiKey.key) {
      const newKey: APIKey = {
        id: String(apiKeys.length + 1),
        ...newApiKey,
        isActive: true,
      };
      setApiKeys([...apiKeys, newKey]);
      setNewApiKey({ name: '', service: '', key: '' });
      setShowNewApiKeyForm(false);
    }
  };

  const handleDeleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter((key) => key.id !== id));
  };

  const toggleApiKeyStatus = (id: string) => {
    setApiKeys(
      apiKeys.map((key) =>
        key.id === id ? { ...key, isActive: !key.isActive } : key
      )
    );
  };

  return (
    <DashboardLayout title="Admin Settings" requiredRoles={['admin']}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Admin · Settings</p>
            <h1 className="text-2xl font-bold tracking-tight mt-1 text-foreground">Platform settings</h1>
          </div>
          <Button
            onClick={handleSaveSettings}
            disabled={saveStatus === 'saving'}
            variant="default"
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Layout container */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left cursor-pointer',
                    active === s.id
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="min-w-0 space-y-6">
            {active === 'ai' && (
              <>
                {/* AI Models Card */}
                <Card className="bg-card border border-border rounded-lg p-5">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Cpu className="w-4 h-4 text-primary shrink-0" />
                      AI Models for Transcription
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                      Install and manage AI models for automatic transcript generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-3">
                    {aiModels.map((model) => (
                      <div
                        key={model.id}
                        className="flex items-start gap-4 p-4 border border-border rounded-md bg-muted/30"
                      >
                        <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                          <Cpu className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-semibold text-xs text-foreground truncate">{model.name}</h4>
                            <Badge
                              className="text-[9px] px-1.5 py-0.5 font-mono"
                              variant={
                                model.status === 'installed'
                                  ? 'default'
                                  : model.status === 'installing'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {model.status === 'installed'
                                ? 'Installed'
                                : model.status === 'installing'
                                ? 'Installing...'
                                : 'Available'}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mb-2 font-mono">
                            {model.provider} • {model.size}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {model.capabilities.map((cap) => (
                              <Badge key={cap} variant="outline" className="text-[9px] px-1.5 py-0">
                                {cap}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {model.status === 'installed' ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleUninstallModel(model.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Uninstall
                            </Button>
                          ) : model.status === 'available' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInstallModel(model.id)}
                            >
                              <Download className="w-3.5 h-3.5" />
                              Install
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled>
                              <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                              Installing
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Transcription Settings Card */}
                <Card className="bg-card border border-border rounded-lg p-5">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-sm font-semibold text-foreground">Transcription Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <div className="min-w-0">
                        <Label className="text-xs font-semibold text-foreground">Auto-generate Transcripts</Label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Automatically transcribe uploaded videos
                        </p>
                      </div>
                      <Switch defaultChecked className="cursor-pointer" />
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <div className="min-w-0">
                        <Label className="text-xs font-semibold text-foreground">Language Detection</Label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Automatically detect video language
                        </p>
                      </div>
                      <Switch defaultChecked className="cursor-pointer" />
                    </div>
                    <div className="space-y-1.5 pt-2">
                      <Label className="text-xs font-semibold text-foreground">Default Language</Label>
                      <Select defaultValue="en">
                        <SelectTrigger className="w-full text-xs cursor-pointer bg-muted border-0 focus:ring-1 focus:ring-ring">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {active === 'api' && (
              <Card className="bg-card border border-border rounded-lg p-5">
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <KeyRound className="w-4 h-4 text-primary shrink-0" />
                        API Keys
                      </CardTitle>
                      <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                        Manage API keys for external services
                      </CardDescription>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowNewApiKeyForm(!showNewApiKeyForm)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Key
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  {showNewApiKeyForm && (
                    <div className="p-4 border border-border rounded-md bg-muted/30 space-y-4">
                      <h4 className="font-semibold text-xs text-foreground">Add New API Key</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground mb-1.5">Name</Label>
                          <Input
                            placeholder="e.g., OpenAI API"
                            value={newApiKey.name}
                            onChange={(e) =>
                              setNewApiKey({ ...newApiKey, name: e.target.value })
                            }
                            className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground mb-1.5">Service</Label>
                          <Select
                            value={newApiKey.service}
                            onValueChange={(value) =>
                              setNewApiKey({ ...newApiKey, service: value })
                            }
                          >
                            <SelectTrigger className="w-full text-xs h-9 cursor-pointer bg-muted border-0 focus:ring-1 focus:ring-ring">
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OpenAI">OpenAI</SelectItem>
                              <SelectItem value="Azure">Azure</SelectItem>
                              <SelectItem value="Google">Google Cloud</SelectItem>
                              <SelectItem value="AWS">AWS</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground mb-1.5">API Key</Label>
                        <Input
                          type="password"
                          placeholder="Enter your API key"
                          value={newApiKey.key}
                          onChange={(e) =>
                            setNewApiKey({ ...newApiKey, key: e.target.value })
                          }
                          className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddApiKey} variant="default">
                          Add API Key
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setShowNewApiKeyForm(false);
                            setNewApiKey({ name: '', service: '', key: '' });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className="flex items-start gap-4 p-4 border border-border rounded-md bg-muted/10"
                    >
                      <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                        <KeyRound className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-semibold text-xs text-foreground truncate">{apiKey.name}</h4>
                          <Badge variant={apiKey.isActive ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0.5 font-mono">
                            {apiKey.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-2 font-mono">
                          {apiKey.service}
                          {apiKey.lastUsed && ` • Last used: ${apiKey.lastUsed}`}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <code className="text-[10px] bg-muted px-2 py-1 rounded font-mono text-foreground select-all">
                            {showApiKeys[apiKey.id]
                              ? apiKey.key
                              : apiKey.key.slice(0, 12) + '•••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => toggleApiKeyVisibility(apiKey.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {showApiKeys[apiKey.id] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(apiKey.key);
                              alert('Key copied to clipboard!');
                            }}
                            className="text-muted-foreground hover:text-foreground"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Switch
                          checked={apiKey.isActive}
                          onCheckedChange={() => toggleApiKeyStatus(apiKey.id)}
                          className="cursor-pointer"
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {active === 'processing' && (
              <>
                {/* Quality Settings Card */}
                <Card className="bg-card border border-border rounded-lg p-5">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Video className="w-4 h-4 text-primary shrink-0" />
                      Default Video Quality Settings
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                      Configure default quality levels for video transcoding
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Default Quality</Label>
                      <Select
                        value={videoSettings.defaultQuality}
                        onValueChange={(value) =>
                          setVideoSettings({ ...videoSettings, defaultQuality: value })
                        }
                      >
                        <SelectTrigger className="w-full text-xs cursor-pointer bg-muted border-0 focus:ring-1 focus:ring-ring">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1080p">1080p Full HD</SelectItem>
                          <SelectItem value="720p">720p HD</SelectItem>
                          <SelectItem value="480p">480p SD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-1">
                      <div className="min-w-0">
                        <Label className="text-xs font-semibold text-foreground">Enable Auto-Transcoding</Label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Automatically transcode videos on upload
                        </p>
                      </div>
                      <Switch
                        checked={videoSettings.enableAutoTranscoding}
                        onCheckedChange={(checked) =>
                          setVideoSettings({
                            ...videoSettings,
                            enableAutoTranscoding: checked,
                          })
                        }
                        className="cursor-pointer"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Available Quality Levels Card */}
                <Card className="bg-card border border-border rounded-lg p-5">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-sm font-semibold text-foreground">Available Quality Levels</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-2">
                    <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/10">
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-foreground">1080p Full HD</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                          1920x1080 • 5000kbps
                        </div>
                      </div>
                      <Switch
                        checked={videoSettings.enable1080p}
                        onCheckedChange={(checked) =>
                          setVideoSettings({ ...videoSettings, enable1080p: checked })
                        }
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/10">
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-foreground">720p HD</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                          1280x720 • 2500kbps
                        </div>
                      </div>
                      <Switch
                        checked={videoSettings.enable720p}
                        onCheckedChange={(checked) =>
                          setVideoSettings({ ...videoSettings, enable720p: checked })
                        }
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/10">
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-foreground">480p SD</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                          854x480 • 1200kbps
                        </div>
                      </div>
                      <Switch
                        checked={videoSettings.enable480p}
                        onCheckedChange={(checked) =>
                          setVideoSettings({ ...videoSettings, enable480p: checked })
                        }
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/10">
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-foreground">360p</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                          640x360 • 800kbps
                        </div>
                      </div>
                      <Switch
                        checked={videoSettings.enable360p}
                        onCheckedChange={(checked) =>
                          setVideoSettings({ ...videoSettings, enable360p: checked })
                        }
                        className="cursor-pointer"
                      />
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-1.5 pt-2">
                      <Label className="text-xs font-semibold text-foreground">Maximum File Size (GB)</Label>
                      <Input
                        type="number"
                        value={videoSettings.maxFileSize}
                        onChange={(e) =>
                          setVideoSettings({
                            ...videoSettings,
                            maxFileSize: e.target.value,
                          })
                        }
                        className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring font-mono"
                      />
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between py-1">
                      <div className="min-w-0">
                        <Label className="text-xs font-semibold text-foreground">Auto-generate Thumbnails</Label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Create thumbnails from video frames
                        </p>
                      </div>
                      <Switch
                        checked={videoSettings.enableThumbnailGeneration}
                        onCheckedChange={(checked) =>
                          setVideoSettings({
                            ...videoSettings,
                            enableThumbnailGeneration: checked,
                          })
                        }
                        className="cursor-pointer"
                      />
                    </div>

                    {videoSettings.enableThumbnailGeneration && (
                      <div className="space-y-1.5 pt-2">
                        <Label className="text-xs font-semibold text-foreground">Number of Thumbnails</Label>
                        <Select
                          value={videoSettings.thumbnailCount}
                          onValueChange={(value) =>
                            setVideoSettings({ ...videoSettings, thumbnailCount: value })
                          }
                        >
                          <SelectTrigger className="w-full text-xs cursor-pointer bg-muted border-0 focus:ring-1 focus:ring-ring font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="font-mono">
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {active === 'storage' && (
              <>
                {/* Storage Settings Card */}
                <Card className="bg-card border border-border rounded-lg p-5">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <HardDrive className="w-4 h-4 text-primary shrink-0" />
                      Storage Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Storage Provider</Label>
                      <Select
                        value={systemSettings.storageProvider}
                        onValueChange={(value) =>
                          setSystemSettings({ ...systemSettings, storageProvider: value })
                        }
                      >
                        <SelectTrigger className="w-full text-xs cursor-pointer bg-muted border-0 focus:ring-1 focus:ring-ring">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local Storage</SelectItem>
                          <SelectItem value="s3">Amazon S3</SelectItem>
                          <SelectItem value="azure">Azure Blob Storage</SelectItem>
                          <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Storage Path</Label>
                      <Input
                        value={systemSettings.storagePath}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            storagePath: e.target.value,
                          })
                        }
                        className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring font-mono"
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-1">
                      <div className="min-w-0">
                        <Label className="text-xs font-semibold text-foreground">Enable CDN</Label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Use CDN for video delivery
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.cdnEnabled}
                        onCheckedChange={(checked) =>
                          setSystemSettings({ ...systemSettings, cdnEnabled: checked })
                        }
                        className="cursor-pointer"
                      />
                    </div>

                    {systemSettings.cdnEnabled && (
                      <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
                        <Label className="text-xs font-semibold text-foreground">CDN URL</Label>
                        <Input
                          placeholder="https://cdn.example.com"
                          value={systemSettings.cdnUrl}
                          onChange={(e) =>
                            setSystemSettings({ ...systemSettings, cdnUrl: e.target.value })
                          }
                          className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring font-mono"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Processing Limits Card */}
                <Card className="bg-card border border-border rounded-lg p-5">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-sm font-semibold text-foreground">Concurrency Limits & Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Max Concurrent Uploads</Label>
                      <Input
                        type="number"
                        value={systemSettings.maxConcurrentUploads}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            maxConcurrentUploads: e.target.value,
                          })
                        }
                        className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Max Concurrent Transcodes</Label>
                      <Input
                        type="number"
                        value={systemSettings.maxConcurrentTranscodes}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            maxConcurrentTranscodes: e.target.value,
                          })
                        }
                        className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring font-mono"
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-1">
                      <div className="min-w-0">
                        <Label className="text-xs font-semibold text-foreground">Enable Analytics</Label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Track video views and engagement
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.enableAnalytics}
                        onCheckedChange={(checked) =>
                          setSystemSettings({ ...systemSettings, enableAnalytics: checked })
                        }
                        className="cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <Label className="text-xs font-semibold text-foreground">Data Retention (days)</Label>
                      <Input
                        type="number"
                        value={systemSettings.retentionDays}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            retentionDays: e.target.value,
                          })
                        }
                        className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring font-mono"
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {active === 'security' && (
              <>
                {/* Authentication settings card */}
                <Card className="bg-card border border-border rounded-lg p-5">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Shield className="w-4 h-4 text-primary shrink-0" />
                      Authentication Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    <div className="flex items-center justify-between py-1">
                      <div className="min-w-0">
                        <Label className="text-xs font-semibold text-foreground">Require Multi-Factor Authentication</Label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Enforce MFA for all users
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.requireMFA}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, requireMFA: checked })
                        }
                        className="cursor-pointer"
                      />
                    </div>

                    <Separator />

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Session Timeout (minutes)</Label>
                      <Input
                        type="number"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            sessionTimeout: e.target.value,
                          })
                        }
                        className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Max Login Attempts</Label>
                      <Input
                        type="number"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            maxLoginAttempts: e.target.value,
                          })
                        }
                        className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring font-mono"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Password Policy Card */}
                <Card className="bg-card border border-border rounded-lg p-5">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-sm font-semibold text-foreground">Password Policy</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Minimum Password Length</Label>
                      <Input
                        type="number"
                        value={securitySettings.passwordMinLength}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            passwordMinLength: e.target.value,
                          })
                        }
                        className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <div className="min-w-0">
                        <Label className="text-xs font-semibold text-foreground">Require Special Characters</Label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Passwords must contain special characters
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.requireSpecialChar}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({
                            ...securitySettings,
                            requireSpecialChar: checked,
                          })
                        }
                        className="cursor-pointer"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Network Security Card */}
                <Card className="bg-card border border-border rounded-lg p-5">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-sm font-semibold text-foreground">Network Security</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    <div className="flex items-center justify-between py-1">
                      <div className="min-w-0">
                        <Label className="text-xs font-semibold text-foreground">Enable IP Whitelist</Label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Restrict access to specific IP addresses
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.enableIPWhitelist}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({
                            ...securitySettings,
                            enableIPWhitelist: checked,
                          })
                        }
                        className="cursor-pointer"
                      />
                    </div>

                    {securitySettings.enableIPWhitelist && (
                      <div className="space-y-1.5 pt-2 animate-in fade-in duration-200">
                        <Label className="text-xs font-semibold text-foreground">Allowed IP Addresses (one per line)</Label>
                        <textarea
                          className="w-full min-h-[100px] p-2.5 rounded-md border-0 bg-muted text-foreground text-xs font-mono outline-hidden focus:ring-1 focus:ring-ring"
                          placeholder="192.168.1.1&#10;10.0.0.0/8"
                          value={securitySettings.ipWhitelist}
                          onChange={(e) =>
                            setSecuritySettings({
                              ...securitySettings,
                              ipWhitelist: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between py-1">
                      <div className="min-w-0">
                        <Label className="text-xs font-semibold text-foreground">Enable Audit Log</Label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Log all administrative actions
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.enableAuditLog}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({
                            ...securitySettings,
                            enableAuditLog: checked,
                          })
                        }
                        className="cursor-pointer"
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {active === 'audit' && (
              <Card className="bg-card border border-border rounded-lg p-5">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    Audit Log
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Immutable record of administrative and security-relevant actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-px font-mono text-[11px] text-foreground">
                  {[
                    { ts: '2026-06-15 09:14:22', actor: 'alex@streamforge.io', action: 'Updated security settings · session timeout 1h → 8h' },
                    { ts: '2026-06-15 08:42:01', actor: 'sarah@streamforge.io', action: 'Published video v_001' },
                    { ts: '2026-06-14 21:18:55', actor: 'system', action: 'API key sfk_live_3c12... used from 198.51.100.12' },
                    { ts: '2026-06-14 16:02:11', actor: 'alex@streamforge.io', action: 'Invited user mira@streamforge.io as editor' },
                    { ts: '2026-06-14 09:30:00', actor: 'jordan@streamforge.io', action: 'Archived video v_010' },
                    { ts: '2026-06-13 22:11:08', actor: 'system', action: 'Auto-suspended user theo@streamforge.io · inactivity' },
                  ].map((e, i) => (
                    <div key={i} className="grid grid-cols-[140px_160px_1fr] gap-3 py-2 px-3 hover:bg-muted/40 rounded transition-colors">
                      <span className="text-muted-foreground">{e.ts}</span>
                      <span className="truncate font-semibold">{e.actor}</span>
                      <span className="text-muted-foreground">{e.action}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
