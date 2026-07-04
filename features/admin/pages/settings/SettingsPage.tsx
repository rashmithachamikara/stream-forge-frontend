'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { apiClient } from '@/shared/lib/api';
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
  Loader2,
  Eye,
  EyeOff,
  Brain,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { UpdateAdminTranscriptionSettingsRequest, AdminRagSettings, UpdateAdminRagSettingsRequest } from '@/features/admin/types';

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
  { id: 'rag', label: 'RAG & LLM', icon: Brain },
  { id: 'api', label: 'API Keys', icon: KeyRound },
  { id: 'processing', label: 'Video Processing', icon: Video },
  { id: 'storage', label: 'Storage & CDN', icon: HardDrive },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'audit', label: 'Audit Log', icon: FileText },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

const normalizeOutputFormats = (formats: string[] | null | undefined) =>
  (formats ?? []).map((format) => format.toUpperCase());

const serializeOutputFormats = (formats: string[] | null | undefined) =>
  (formats ?? []).map((format) => format.toLowerCase());

const modelDisplayLabels: Record<string, string> = {
  // Gemini
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-3.1-flash-lite': 'Gemini 3.1 Flash Lite',
  'gemini-3.5-flash': 'Gemini 3.5 Flash',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-3-flash': 'Gemini 3 Flash',
  // Grok
  'grok-3-mini': 'Grok 3 Mini',
  'grok-3': 'Grok 3',
  // Groq
  'llama-3.1-8b-instant': 'Llama 3.1 8B Instant',
  'llama-3.3-70b-versatile': 'Llama 3.3 70B Versatile',
  'openai/gpt-oss-120b': 'GPT OSS 120B',
  'openai/gpt-oss-20b': 'GPT OSS 20B',
  'qwen/qwen3-32b': 'Qwen 3 32B',
  'qwen/qwen3.6-27b': 'Qwen 3.6 27B',
};

const getModelLabel = (modelId: string) => modelDisplayLabels[modelId] || modelId;

const DEFAULT_QA_CATALOG = [
  {
    provider: 'gemini',
    defaultModel: 'gemini-3.1-flash-lite',
    models: [
      'gemini-2.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-2.5-pro',
      'gemini-3-flash'
    ]
  },
  {
    provider: 'grok',
    defaultModel: 'grok-3-mini',
    models: ['grok-3-mini', 'grok-3']
  },
  {
    provider: 'groq',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3-32b',
      'qwen/qwen3.6-27b'
    ]
  }
];

const TRANSCRIPTION_PROVIDER_OPTIONS = [
  { value: 'local-faster-whisper', label: 'Local Whisper' },
] as const;

const LOCAL_WHISPER_MODEL_OPTIONS = [
  'tiny',
  'base',
  'small',
  'medium',
  'large-v3',
] as const;

const LOCAL_WHISPER_DEVICE_OPTIONS = ['cpu', 'cuda'] as const;
const LOCAL_WHISPER_COMPUTE_TYPE_OPTIONS = ['int8', 'float16', 'float32'] as const;

export default function AdminSettingsPage() {
  const [active, setActive] = useState<SectionId>('ai');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});
  const [transcriptionSettings, setTranscriptionSettings] =
    useState<UpdateAdminTranscriptionSettingsRequest | null>(null);
  const [savedTranscriptionSettings, setSavedTranscriptionSettings] =
    useState<UpdateAdminTranscriptionSettingsRequest | null>(null);
  const [transcriptionSettingsError, setTranscriptionSettingsError] = useState<string | null>(null);
  const [isTranscriptionSettingsLoading, setIsTranscriptionSettingsLoading] = useState(true);

  // RAG Settings State
  const [ragSettings, setRagSettings] = useState<AdminRagSettings | null>(null);
  const [savedRagSettings, setSavedRagSettings] = useState<AdminRagSettings | null>(null);
  const [isRagSettingsLoading, setIsRagSettingsLoading] = useState(true);
  const [ragSettingsError, setRagSettingsError] = useState<string | null>(null);

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

  useEffect(() => {
    let isMounted = true;

    const loadTranscriptionSettings = async () => {
      setIsTranscriptionSettingsLoading(true);
      const response = await apiClient.getAdminTranscriptionSettings();

      if (!isMounted) {
        return;
      }

      if (response.success && response.data) {
        const nextSettings = {
          enabled: response.data.enabled,
          autoTranscribeOnReady: response.data.autoTranscribeOnReady,
          provider: response.data.provider,
          defaultLanguage: response.data.defaultLanguage,
          outputFormats: normalizeOutputFormats(response.data.outputFormats),
          model: response.data.model,
          device: response.data.device,
          computeType: response.data.computeType,
          beamSize: response.data.beamSize,
          enableVad: response.data.enableVad,
          enableWordTimestamps: response.data.enableWordTimestamps,
        };
        setTranscriptionSettings(nextSettings);
        setSavedTranscriptionSettings(nextSettings);
        setTranscriptionSettingsError(null);
      } else {
        setTranscriptionSettingsError(response.error ?? 'Failed to load transcription settings');
      }

      setIsTranscriptionSettingsLoading(false);
    };

    void loadTranscriptionSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadRagSettings = async () => {
      setIsRagSettingsLoading(true);
      const response = await apiClient.getAdminRagSettings();

      if (!isMounted) return;

      if (response.success && response.data) {
        setRagSettings(response.data);
        setSavedRagSettings(response.data);
        setRagSettingsError(null);
      } else {
        setRagSettingsError(response.error ?? 'Failed to load RAG settings');
      }

      setIsRagSettingsLoading(false);
    };

    void loadRagSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveRagSettings = async () => {
    if (!ragSettings) {
      return;
    }

    setSaveStatus('saving');
    setRagSettingsError(null);

    const payload: UpdateAdminRagSettingsRequest = {
      enabled: ragSettings.enabled,
      semanticSearchEnabled: ragSettings.semanticSearchEnabled,
      videoQuestionsEnabled: ragSettings.videoQuestionsEnabled,
      crossVideoQuestionsEnabled: ragSettings.crossVideoQuestionsEnabled,
      embeddingProvider: ragSettings.embeddingProvider,
      embeddingModel: ragSettings.embeddingModel,
      embeddingBatchSize: ragSettings.embeddingBatchSize,
      retrievalDefaultMode: ragSettings.retrievalDefaultMode,
      semanticTopK: ragSettings.semanticTopK,
      fullTextTopK: ragSettings.fullTextTopK,
      hybridSemanticWeight: ragSettings.hybridSemanticWeight,
      hybridLexicalWeight: ragSettings.hybridLexicalWeight,
      hybridMaxCandidates: ragSettings.hybridMaxCandidates,
      qaProvider: ragSettings.qaProvider,
      geminiQaModel: ragSettings.geminiQaModel,
      grokQaModel: ragSettings.grokQaModel,
      groqQaModel: ragSettings.groqQaModel,
      qaMaxContextChunks: ragSettings.qaMaxContextChunks,
      qaMaxCitations: ragSettings.qaMaxCitations,
      qaTemperature: ragSettings.qaTemperature,
      qaMaxOutputTokens: ragSettings.qaMaxOutputTokens,
      geminiApiKey: ragSettings.geminiApiKey.maskedValue !== '••••••••••••••••' ? ragSettings.geminiApiKey.maskedValue : undefined,
      grokApiKey: ragSettings.grokApiKey.maskedValue !== '••••••••••••••••' ? ragSettings.grokApiKey.maskedValue : undefined,
      groqApiKey: ragSettings.groqApiKey.maskedValue !== '••••••••••••••••' ? ragSettings.groqApiKey.maskedValue : undefined,
    };

    const response = await apiClient.updateAdminRagSettings(payload);

    setSaveStatus('idle');

    if (response.success && response.data) {
      setRagSettings(response.data);
      setSavedRagSettings(response.data);
      toast.success('RAG settings saved successfully');
    } else {
      toast.error(response.error ?? 'Failed to save RAG settings');
    }
  };

  const hasPendingRagChanges = useMemo(() => {
    if (!ragSettings || !savedRagSettings) {
      return false;
    }
    return JSON.stringify(ragSettings) !== JSON.stringify(savedRagSettings);
  }, [savedRagSettings, ragSettings]);

  const handleSaveSettings = async () => {
    if (!transcriptionSettings) {
      return;
    }

    setSaveStatus('saving');
    setTranscriptionSettingsError(null);

    const response = await apiClient.updateAdminTranscriptionSettings({
      ...transcriptionSettings,
      outputFormats: serializeOutputFormats(transcriptionSettings.outputFormats),
    });

    setSaveStatus('idle');

    if (response.success && response.data) {
      const nextSettings = {
        enabled: response.data.enabled,
        autoTranscribeOnReady: response.data.autoTranscribeOnReady,
        provider: response.data.provider,
        defaultLanguage: response.data.defaultLanguage,
        outputFormats: normalizeOutputFormats(response.data.outputFormats),
        model: response.data.model,
        device: response.data.device,
        computeType: response.data.computeType,
        beamSize: response.data.beamSize,
        enableVad: response.data.enableVad,
        enableWordTimestamps: response.data.enableWordTimestamps,
      };
      setTranscriptionSettings(nextSettings);
      setSavedTranscriptionSettings(nextSettings);
      toast.success('Transcription settings saved successfully');
    } else {
      toast.error(response.error ?? 'Failed to save transcription settings');
    }
  };

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKeys((prev) => ({ ...prev, [id]: !prev[id] }));
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

  const toggleOutputFormat = (format: string) => {
    setTranscriptionSettings((current) => {
      if (!current) {
        return current;
      }

      const alreadySelected = current.outputFormats?.includes(format) ?? false;
      const currentOutputFormats = current.outputFormats ?? [];
      return {
        ...current,
        outputFormats: alreadySelected
          ? currentOutputFormats.filter((item) => item !== format)
          : [...currentOutputFormats, format],
      };
    });
  };

  const hasPendingTranscriptionChanges = useMemo(() => {
    if (!transcriptionSettings || !savedTranscriptionSettings) {
      return false;
    }

    return JSON.stringify(transcriptionSettings) !== JSON.stringify(savedTranscriptionSettings);
  }, [savedTranscriptionSettings, transcriptionSettings]);

  return (
    <DashboardLayout title="Admin Settings" requiredRoles={['admin']}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Admin · Settings</p>
            <h1 className="text-2xl font-bold tracking-tight mt-1 text-foreground">Platform settings</h1>
          </div>
          {active === 'ai' ? (
            <Button
              onClick={() => void handleSaveSettings()}
              disabled={
                saveStatus === 'saving' ||
                isTranscriptionSettingsLoading ||
                !transcriptionSettings ||
                !hasPendingTranscriptionChanges
              }
              variant="default"
              className="gap-2"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          ) : active === 'rag' ? (
            <Button
              onClick={() => void handleSaveRagSettings()}
              disabled={
                saveStatus === 'saving' ||
                isRagSettingsLoading ||
                !ragSettings ||
                !hasPendingRagChanges
              }
              variant="default"
              className="gap-2"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          ) : null}
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
                <Card className="bg-card border border-border rounded-lg p-5">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Cpu className="w-4 h-4 text-primary shrink-0" />
                      Transcription Settings
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                      Configure transcript generation defaults and worker behavior.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    {transcriptionSettingsError ? (
                      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                        {transcriptionSettingsError}
                      </div>
                    ) : null}

                    {isTranscriptionSettingsLoading || !transcriptionSettings ? (
                      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading transcription settings...
                      </div>
                    ) : (
                      <>
                        <div className="rounded-md border border-border bg-muted/20 p-4">
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-foreground">Global</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Shared transcription behavior across all providers.
                            </p>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <Label className="text-xs font-semibold text-foreground">Enabled</Label>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  Master switch for the transcription pipeline.
                                </p>
                              </div>
                              <Switch
                                checked={transcriptionSettings.enabled}
                                onCheckedChange={(checked) =>
                                  setTranscriptionSettings((current) =>
                                    current ? { ...current, enabled: checked } : current
                                  )
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <Label className="text-xs font-semibold text-foreground">Auto-transcribe on ready</Label>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  Start transcript generation when a video finishes transcoding.
                                </p>
                              </div>
                              <Switch
                                checked={transcriptionSettings.autoTranscribeOnReady}
                                onCheckedChange={(checked) =>
                                  setTranscriptionSettings((current) =>
                                    current ? { ...current, autoTranscribeOnReady: checked } : current
                                  )
                                }
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Provider</Label>
                              <Select
                                value={transcriptionSettings.provider ?? 'local-faster-whisper'}
                                onValueChange={(value) =>
                                  setTranscriptionSettings((current) =>
                                    current ? { ...current, provider: value } : current
                                  )
                                }
                              >
                                <SelectTrigger className="w-full text-xs cursor-pointer bg-muted border-0 focus:ring-1 focus:ring-ring">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TRANSCRIPTION_PROVIDER_OPTIONS.map((provider) => (
                                    <SelectItem key={provider.value} value={provider.value}>
                                      {provider.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Default Language</Label>
                              <Select
                                value={transcriptionSettings.defaultLanguage ?? 'auto'}
                                onValueChange={(value) =>
                                  setTranscriptionSettings((current) =>
                                    current
                                      ? {
                                          ...current,
                                          defaultLanguage: value,
                                        }
                                      : current
                                  )
                                }
                              >
                                <SelectTrigger className="w-full text-xs cursor-pointer bg-muted border-0 focus:ring-1 focus:ring-ring">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="auto">Auto</SelectItem>
                                  <SelectItem value="en">English</SelectItem>
                                  <SelectItem value="es">Spanish</SelectItem>
                                  <SelectItem value="fr">French</SelectItem>
                                  <SelectItem value="de">German</SelectItem>
                                  <SelectItem value="ja">Japanese</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Output Formats</Label>
                              <div className="flex flex-wrap gap-2">
                                {['VTT', 'SRT'].map((format) => {
                                  const isSelected = transcriptionSettings.outputFormats?.includes(format);
                                  return (
                                    <Button
                                      key={format}
                                      type="button"
                                      size="sm"
                                      variant={isSelected ? 'default' : 'outline'}
                                      onClick={() => toggleOutputFormat(format)}
                                    >
                                      {format}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {transcriptionSettings.provider === 'local-faster-whisper' ? (
                          <div className="rounded-md border border-border bg-muted/20 p-4">
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-foreground">Local Whisper</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Provider-specific options for the local Faster-Whisper worker.
                              </p>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">Model</Label>
                                <Select
                                  value={transcriptionSettings.model ?? 'small'}
                                  onValueChange={(value) =>
                                    setTranscriptionSettings((current) =>
                                      current ? { ...current, model: value } : current
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-full text-xs cursor-pointer bg-muted border-0 focus:ring-1 focus:ring-ring">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {LOCAL_WHISPER_MODEL_OPTIONS.map((model) => (
                                      <SelectItem key={model} value={model}>
                                        {model}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">Device</Label>
                                <Select
                                  value={transcriptionSettings.device ?? 'cpu'}
                                  onValueChange={(value) =>
                                    setTranscriptionSettings((current) =>
                                      current ? { ...current, device: value } : current
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-full text-xs cursor-pointer bg-muted border-0 focus:ring-1 focus:ring-ring">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {LOCAL_WHISPER_DEVICE_OPTIONS.map((device) => (
                                      <SelectItem key={device} value={device}>
                                        {device}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">Compute Type</Label>
                                <Select
                                  value={transcriptionSettings.computeType ?? 'int8'}
                                  onValueChange={(value) =>
                                    setTranscriptionSettings((current) =>
                                      current ? { ...current, computeType: value } : current
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-full text-xs cursor-pointer bg-muted border-0 focus:ring-1 focus:ring-ring">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {LOCAL_WHISPER_COMPUTE_TYPE_OPTIONS.map((computeType) => (
                                      <SelectItem key={computeType} value={computeType}>
                                        {computeType}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">Beam Size</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={transcriptionSettings.beamSize}
                                  onChange={(event) =>
                                    setTranscriptionSettings((current) =>
                                      current
                                        ? {
                                            ...current,
                                            beamSize: Math.min(20, Math.max(1, Number(event.target.value) || 1)),
                                          }
                                        : current
                                    )
                                  }
                                  className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                                />
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                              <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/60 px-3 py-3">
                                <div>
                                  <Label className="text-xs font-semibold text-foreground">Voice activity detection</Label>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Trim long silences during transcription.
                                  </p>
                                </div>
                                <Switch
                                  checked={transcriptionSettings.enableVad}
                                  onCheckedChange={(checked) =>
                                    setTranscriptionSettings((current) =>
                                      current ? { ...current, enableVad: checked } : current
                                    )
                                  }
                                />
                              </div>

                              <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/60 px-3 py-3">
                                <div>
                                  <Label className="text-xs font-semibold text-foreground">Word timestamps</Label>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Include finer-grained word timings when supported.
                                  </p>
                                </div>
                                <Switch
                                  checked={transcriptionSettings.enableWordTimestamps}
                                  onCheckedChange={(checked) =>
                                    setTranscriptionSettings((current) =>
                                      current ? { ...current, enableWordTimestamps: checked } : current
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {active === 'rag' && (
              <>
                <Card className="bg-card border border-border rounded-lg p-5">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Brain className="w-4 h-4 text-primary shrink-0" />
                      RAG & LLM Settings
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                      Configure Retrieval-Augmented Generation, vector embeddings, and LLM features.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-6">
                    {ragSettingsError ? (
                      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                        {ragSettingsError}
                      </div>
                    ) : null}

                    {isRagSettingsLoading || !ragSettings ? (
                      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading RAG settings...
                      </div>
                    ) : (
                      <div className="space-y-6 text-left">
                        {/* Global Feature Toggles */}
                        <div className="rounded-md border border-border bg-muted/20 p-4">
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-foreground">Global Features</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Enable or disable RAG functionalities across the platform.
                            </p>
                          </div>
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <Label className="text-xs font-semibold text-foreground">Master RAG Switch</Label>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Enable RAG indexing and assistant services.</p>
                              </div>
                              <Switch
                                checked={ragSettings.enabled}
                                onCheckedChange={(checked) => setRagSettings(current => current ? { ...current, enabled: checked } : current)}
                              />
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <Label className="text-xs font-semibold text-foreground">Semantic Search</Label>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Allows conceptually searching transcription chunks.</p>
                              </div>
                              <Switch
                                checked={ragSettings.semanticSearchEnabled}
                                onCheckedChange={(checked) => setRagSettings(current => current ? { ...current, semanticSearchEnabled: checked } : current)}
                              />
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <Label className="text-xs font-semibold text-foreground">In-Video Questions</Label>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Let users ask questions about individual video transcriptions.</p>
                              </div>
                              <Switch
                                checked={ragSettings.videoQuestionsEnabled}
                                onCheckedChange={(checked) => setRagSettings(current => current ? { ...current, videoQuestionsEnabled: checked } : current)}
                              />
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <Label className="text-xs font-semibold text-foreground">Cross-Video Questions</Label>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Enable library-wide Q&A from the global drawer.</p>
                              </div>
                              <Switch
                                checked={ragSettings.crossVideoQuestionsEnabled}
                                onCheckedChange={(checked) => setRagSettings(current => current ? { ...current, crossVideoQuestionsEnabled: checked } : current)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Embedding settings */}
                        <div className="rounded-md border border-border bg-muted/20 p-4">
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-foreground">Vector Embeddings</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Configure text vectorization models and batch sizes.</p>
                          </div>
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Embedding Provider</Label>
                              <Select
                                value={ragSettings.embeddingProvider ?? 'local'}
                                onValueChange={(val) => setRagSettings(current => current ? { ...current, embeddingProvider: val } : current)}
                              >
                                <SelectTrigger className="w-full text-xs cursor-pointer bg-muted border-0 focus:ring-1 focus:ring-ring">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="local">Local</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Embedding Model</Label>
                              <Input
                                value={ragSettings.embeddingModel ?? ''}
                                onChange={(e) => setRagSettings(current => current ? { ...current, embeddingModel: e.target.value } : current)}
                                className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Batch Size</Label>
                              <Input
                                type="number"
                                value={ragSettings.embeddingBatchSize}
                                onChange={(e) => setRagSettings(current => current ? { ...current, embeddingBatchSize: parseInt(e.target.value, 10) || 0 } : current)}
                                className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Search settings */}
                        <div className="rounded-md border border-border bg-muted/20 p-4">
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-foreground">Retrieval & Search weights</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Tune weights and parameters for semantic and hybrid search modes.</p>
                          </div>
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Default Retrieval Mode</Label>
                              <Select
                                value={ragSettings.retrievalDefaultMode ?? 'semantic'}
                                onValueChange={(val) => setRagSettings(current => current ? { ...current, retrievalDefaultMode: val } : current)}
                              >
                                <SelectTrigger className="w-full text-xs cursor-pointer bg-muted border-0 focus:ring-1 focus:ring-ring">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="semantic">Semantic</SelectItem>
                                  <SelectItem value="hybrid">Hybrid</SelectItem>
                                  <SelectItem value="lexical">Lexical (Keyword)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Semantic Top-K</Label>
                              <Input
                                type="number"
                                value={ragSettings.semanticTopK}
                                onChange={(e) => setRagSettings(current => current ? { ...current, semanticTopK: parseInt(e.target.value, 10) || 0 } : current)}
                                className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Full-text Top-K</Label>
                              <Input
                                type="number"
                                value={ragSettings.fullTextTopK}
                                onChange={(e) => setRagSettings(current => current ? { ...current, fullTextTopK: parseInt(e.target.value, 10) || 0 } : current)}
                                className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Hybrid Max Candidates</Label>
                              <Input
                                type="number"
                                value={ragSettings.hybridMaxCandidates}
                                onChange={(e) => setRagSettings(current => current ? { ...current, hybridMaxCandidates: parseInt(e.target.value, 10) || 0 } : current)}
                                className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Hybrid Semantic Weight ({ragSettings.hybridSemanticWeight})</Label>
                              <Input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={ragSettings.hybridSemanticWeight}
                                onChange={(e) => setRagSettings(current => {
                                  if (!current) return current;
                                  const sem = parseFloat(e.target.value);
                                  const lex = Math.round((1.0 - sem) * 100) / 100;
                                  return { ...current, hybridSemanticWeight: sem, hybridLexicalWeight: lex };
                                })}
                                className="w-full h-8"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Hybrid Lexical Weight ({ragSettings.hybridLexicalWeight})</Label>
                              <Input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={ragSettings.hybridLexicalWeight}
                                onChange={(e) => setRagSettings(current => {
                                  if (!current) return current;
                                  const lex = parseFloat(e.target.value);
                                  const sem = Math.round((1.0 - lex) * 100) / 100;
                                  return { ...current, hybridLexicalWeight: lex, hybridSemanticWeight: sem };
                                })}
                                className="w-full h-8"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Generative AI settings */}
                        <div className="rounded-md border border-border bg-muted/20 p-4">
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-foreground">Generative QA Settings</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Configure the conversational model parameters for answering questions.</p>
                          </div>
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">QA LLM Provider</Label>
                              <Select
                                value={ragSettings.qaProvider ?? 'gemini'}
                                onValueChange={(val) => setRagSettings(current => current ? { ...current, qaProvider: val } : current)}
                              >
                                <SelectTrigger className="w-full text-xs cursor-pointer bg-muted border-0 focus:ring-1 focus:ring-ring">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="gemini">Gemini</SelectItem>
                                  <SelectItem value="groq">Groq</SelectItem>
                                  <SelectItem value="grok">Grok</SelectItem>
                                  <SelectItem value="openai">OpenAI</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Provider Specific Configuration */}
                            {(() => {
                              const catalog = ragSettings.qaModelCatalog && ragSettings.qaModelCatalog.length > 0
                                ? ragSettings.qaModelCatalog
                                : DEFAULT_QA_CATALOG;
                              const providerCatalog = catalog.find(item => item.provider === ragSettings.qaProvider);
                              const showConfig = ragSettings.qaProvider === 'gemini' || ragSettings.qaProvider === 'grok' || ragSettings.qaProvider === 'groq';

                              if (!showConfig) return null;

                              return (
                                <div className="lg:col-span-2 p-3 rounded-md border border-border bg-muted/30 space-y-4 my-2">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {ragSettings.qaProvider === 'gemini' ? 'Gemini' : ragSettings.qaProvider === 'grok' ? 'Grok' : 'Groq'} Configuration
                                  </p>
                                  <div className="grid gap-4 md:grid-cols-2">
                                    {/* Model Selector */}
                                    {providerCatalog && providerCatalog.models && providerCatalog.models.length > 0 && (
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-foreground">Active Model</Label>
                                        <Select
                                          value={
                                            (ragSettings.qaProvider === 'gemini'
                                              ? ragSettings.geminiQaModel
                                              : ragSettings.qaProvider === 'grok'
                                              ? ragSettings.grokQaModel
                                              : ragSettings.groqQaModel) ?? (providerCatalog.defaultModel || '')
                                          }
                                          onValueChange={(val) => {
                                            setRagSettings(current => {
                                              if (!current) return current;
                                              if (current.qaProvider === 'gemini') {
                                                return { ...current, geminiQaModel: val };
                                              } else if (current.qaProvider === 'grok') {
                                                return { ...current, grokQaModel: val };
                                              } else if (current.qaProvider === 'groq') {
                                                return { ...current, groqQaModel: val };
                                              }
                                              return current;
                                            });
                                          }}
                                        >
                                          <SelectTrigger className="w-full text-xs cursor-pointer bg-muted border-0 focus:ring-1 focus:ring-ring">
                                            <SelectValue placeholder="Select model..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {providerCatalog.models.map(model => (
                                              <SelectItem key={model} value={model}>
                                                {getModelLabel(model)}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}

                                    {/* API Key */}
                                    {ragSettings.qaProvider === 'gemini' && (
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                          <Label className="text-xs font-semibold text-foreground">Gemini API Key</Label>
                                          {ragSettings.geminiApiKey.isConfigured && (
                                            <Badge variant="secondary" className="text-[9px] px-1.5 font-mono">Configured</Badge>
                                          )}
                                        </div>
                                        <Input
                                          type="password"
                                          placeholder={ragSettings.geminiApiKey.isConfigured ? '••••••••••••••••' : 'Enter API Key'}
                                          onChange={(e) => setRagSettings(current => {
                                            if (!current) return current;
                                            return {
                                              ...current,
                                              geminiApiKey: {
                                                isConfigured: current.geminiApiKey.isConfigured,
                                                maskedValue: e.target.value || (current.geminiApiKey.isConfigured ? '••••••••••••••••' : null)
                                              }
                                            };
                                          })}
                                          className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                      </div>
                                    )}

                                    {ragSettings.qaProvider === 'grok' && (
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                          <Label className="text-xs font-semibold text-foreground">Grok API Key</Label>
                                          {ragSettings.grokApiKey.isConfigured && (
                                            <Badge variant="secondary" className="text-[9px] px-1.5 font-mono">Configured</Badge>
                                          )}
                                        </div>
                                        <Input
                                          type="password"
                                          placeholder={ragSettings.grokApiKey.isConfigured ? '••••••••••••••••' : 'Enter API Key'}
                                          onChange={(e) => setRagSettings(current => {
                                            if (!current) return current;
                                            return {
                                              ...current,
                                              grokApiKey: {
                                                isConfigured: current.grokApiKey.isConfigured,
                                                maskedValue: e.target.value || (current.grokApiKey.isConfigured ? '••••••••••••••••' : null)
                                              }
                                            };
                                          })}
                                          className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                      </div>
                                    )}

                                    {ragSettings.qaProvider === 'groq' && (
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                          <Label className="text-xs font-semibold text-foreground">Groq API Key</Label>
                                          {ragSettings.groqApiKey.isConfigured && (
                                            <Badge variant="secondary" className="text-[9px] px-1.5 font-mono">Configured</Badge>
                                          )}
                                        </div>
                                        <Input
                                          type="password"
                                          placeholder={ragSettings.groqApiKey.isConfigured ? '••••••••••••••••' : 'Enter API Key'}
                                          onChange={(e) => setRagSettings(current => {
                                            if (!current) return current;
                                            return {
                                              ...current,
                                              groqApiKey: {
                                                isConfigured: current.groqApiKey.isConfigured,
                                                maskedValue: e.target.value || (current.groqApiKey.isConfigured ? '••••••••••••••••' : null)
                                              }
                                            };
                                          })}
                                          className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Max Context Chunks</Label>
                              <Input
                                type="number"
                                value={ragSettings.qaMaxContextChunks}
                                onChange={(e) => setRagSettings(current => current ? { ...current, qaMaxContextChunks: parseInt(e.target.value, 10) || 0 } : current)}
                                className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Max Citations</Label>
                              <Input
                                type="number"
                                value={ragSettings.qaMaxCitations}
                                onChange={(e) => setRagSettings(current => current ? { ...current, qaMaxCitations: parseInt(e.target.value, 10) || 0 } : current)}
                                className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Max Output Tokens</Label>
                              <Input
                                type="number"
                                value={ragSettings.qaMaxOutputTokens}
                                onChange={(e) => setRagSettings(current => current ? { ...current, qaMaxOutputTokens: parseInt(e.target.value, 10) || 0 } : current)}
                                className="text-xs h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground">Temperature ({ragSettings.qaTemperature})</Label>
                              <Input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={ragSettings.qaTemperature}
                                onChange={(e) => setRagSettings(current => current ? { ...current, qaTemperature: parseFloat(e.target.value) } : current)}
                                className="w-full h-8"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
