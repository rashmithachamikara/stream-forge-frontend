'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Bot,
  Key,
  Video,
  Server,
  Database,
  Shield,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Plus,
} from 'lucide-react';

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

export default function AdminSettingsPage() {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Settings className="w-8 h-8" />
              System Settings
            </h1>
            <p className="text-muted-foreground">
              Configure AI models, API keys, and system preferences
            </p>
          </div>
          <Button
            onClick={handleSaveSettings}
            disabled={saveStatus === 'saving'}
            className="gap-2"
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle className="w-4 h-4" />
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

        {/* Tabs */}
        <Tabs defaultValue="ai-models" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="ai-models" className="gap-2">
              <Bot className="w-4 h-4" />
              AI Models
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-2">
              <Video className="w-4 h-4" />
              Video
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Server className="w-4 h-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* AI Models Tab */}
          <TabsContent value="ai-models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  AI Models for Transcription
                </CardTitle>
                <CardDescription>
                  Install and manage AI models for automatic transcript generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiModels.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-start gap-4 p-4 border border-border rounded-lg bg-muted/30"
                  >
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{model.name}</h4>
                        <Badge
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
                      <p className="text-sm text-muted-foreground mb-2">
                        {model.provider} • {model.size}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {model.capabilities.map((cap) => (
                          <Badge key={cap} variant="outline" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {model.status === 'installed' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUninstallModel(model.id)}
                          className="gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Uninstall
                        </Button>
                      ) : model.status === 'available' ? (
                        <Button
                          size="sm"
                          onClick={() => handleInstallModel(model.id)}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Install
                        </Button>
                      ) : (
                        <Button size="sm" disabled className="gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Installing
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transcription Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Auto-generate Transcripts</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically transcribe uploaded videos
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Language Detection</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically detect video language
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
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
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      API Keys
                    </CardTitle>
                    <CardDescription>
                      Manage API keys for external services
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowNewApiKeyForm(!showNewApiKeyForm)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showNewApiKeyForm && (
                  <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-4">
                    <h4 className="font-semibold">Add New API Key</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          placeholder="e.g., OpenAI API"
                          value={newApiKey.name}
                          onChange={(e) =>
                            setNewApiKey({ ...newApiKey, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Service</Label>
                        <Select
                          value={newApiKey.service}
                          onValueChange={(value) =>
                            setNewApiKey({ ...newApiKey, service: value })
                          }
                        >
                          <SelectTrigger>
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
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        placeholder="Enter your API key"
                        value={newApiKey.key}
                        onChange={(e) =>
                          setNewApiKey({ ...newApiKey, key: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddApiKey}>Add API Key</Button>
                      <Button
                        variant="outline"
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
                    className="flex items-start gap-4 p-4 border border-border rounded-lg"
                  >
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Key className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{apiKey.name}</h4>
                        <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                          {apiKey.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {apiKey.service}
                        {apiKey.lastUsed && ` • Last used: ${apiKey.lastUsed}`}
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {showApiKeys[apiKey.id]
                            ? apiKey.key
                            : apiKey.key.slice(0, 12) + '••••••••••'}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleApiKeyVisibility(apiKey.id)}
                        >
                          {showApiKeys[apiKey.id] ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Switch
                        checked={apiKey.isActive}
                        onCheckedChange={() => toggleApiKeyStatus(apiKey.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteApiKey(apiKey.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Settings Tab */}
          <TabsContent value="video" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Default Video Quality Settings
                </CardTitle>
                <CardDescription>
                  Configure default quality levels for video transcoding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Quality</Label>
                  <Select
                    value={videoSettings.defaultQuality}
                    onValueChange={(value) =>
                      setVideoSettings({ ...videoSettings, defaultQuality: value })
                    }
                  >
                    <SelectTrigger>
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

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable Auto-Transcoding</Label>
                    <p className="text-sm text-muted-foreground">
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
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base">Available Quality Levels</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <div className="font-medium">1080p Full HD</div>
                        <div className="text-sm text-muted-foreground">
                          1920x1080 • 5000kbps
                        </div>
                      </div>
                      <Switch
                        checked={videoSettings.enable1080p}
                        onCheckedChange={(checked) =>
                          setVideoSettings({ ...videoSettings, enable1080p: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <div className="font-medium">720p HD</div>
                        <div className="text-sm text-muted-foreground">
                          1280x720 • 2500kbps
                        </div>
                      </div>
                      <Switch
                        checked={videoSettings.enable720p}
                        onCheckedChange={(checked) =>
                          setVideoSettings({ ...videoSettings, enable720p: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <div className="font-medium">480p SD</div>
                        <div className="text-sm text-muted-foreground">
                          854x480 • 1200kbps
                        </div>
                      </div>
                      <Switch
                        checked={videoSettings.enable480p}
                        onCheckedChange={(checked) =>
                          setVideoSettings({ ...videoSettings, enable480p: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <div className="font-medium">360p</div>
                        <div className="text-sm text-muted-foreground">
                          640x360 • 800kbps
                        </div>
                      </div>
                      <Switch
                        checked={videoSettings.enable360p}
                        onCheckedChange={(checked) =>
                          setVideoSettings({ ...videoSettings, enable360p: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Maximum File Size (GB)</Label>
                  <Input
                    type="number"
                    value={videoSettings.maxFileSize}
                    onChange={(e) =>
                      setVideoSettings({
                        ...videoSettings,
                        maxFileSize: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Auto-generate Thumbnails</Label>
                    <p className="text-sm text-muted-foreground">
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
                  />
                </div>

                {videoSettings.enableThumbnailGeneration && (
                  <div className="space-y-2">
                    <Label>Number of Thumbnails</Label>
                    <Select
                      value={videoSettings.thumbnailCount}
                      onValueChange={(value) =>
                        setVideoSettings({ ...videoSettings, thumbnailCount: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Storage Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Storage Provider</Label>
                  <Select
                    value={systemSettings.storageProvider}
                    onValueChange={(value) =>
                      setSystemSettings({ ...systemSettings, storageProvider: value })
                    }
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label>Storage Path</Label>
                  <Input
                    value={systemSettings.storagePath}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        storagePath: e.target.value,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable CDN</Label>
                    <p className="text-sm text-muted-foreground">
                      Use CDN for video delivery
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.cdnEnabled}
                    onCheckedChange={(checked) =>
                      setSystemSettings({ ...systemSettings, cdnEnabled: checked })
                    }
                  />
                </div>

                {systemSettings.cdnEnabled && (
                  <div className="space-y-2">
                    <Label>CDN URL</Label>
                    <Input
                      placeholder="https://cdn.example.com"
                      value={systemSettings.cdnUrl}
                      onChange={(e) =>
                        setSystemSettings({ ...systemSettings, cdnUrl: e.target.value })
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Processing Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Concurrent Uploads</Label>
                  <Input
                    type="number"
                    value={systemSettings.maxConcurrentUploads}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        maxConcurrentUploads: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Concurrent Transcodes</Label>
                  <Input
                    type="number"
                    value={systemSettings.maxConcurrentTranscodes}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        maxConcurrentTranscodes: e.target.value,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Track video views and engagement
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.enableAnalytics}
                    onCheckedChange={(checked) =>
                      setSystemSettings({ ...systemSettings, enableAnalytics: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Retention (days)</Label>
                  <Input
                    type="number"
                    value={systemSettings.retentionDays}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        retentionDays: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Authentication Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Require Multi-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Enforce MFA for all users
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireMFA}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, requireMFA: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeout: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        maxLoginAttempts: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Password Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Minimum Password Length</Label>
                  <Input
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordMinLength: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Require Special Characters</Label>
                    <p className="text-sm text-muted-foreground">
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
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable IP Whitelist</Label>
                    <p className="text-sm text-muted-foreground">
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
                  />
                </div>

                {securitySettings.enableIPWhitelist && (
                  <div className="space-y-2">
                    <Label>Allowed IP Addresses (one per line)</Label>
                    <textarea
                      className="w-full min-h-[100px] p-2 rounded-md border border-border bg-background text-foreground"
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

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable Audit Log</Label>
                    <p className="text-sm text-muted-foreground">
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
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Banner */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Changes require review
                </h4>
                <p className="text-sm text-muted-foreground">
                  Some settings changes may require system restart or affect ongoing
                  operations. Please review changes carefully before saving.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
