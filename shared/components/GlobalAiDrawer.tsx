'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Trash2, Send, Sparkles, Search, Layers, Check } from 'lucide-react';
import { apiClient } from '@/shared/lib/api';
import { Video, GroundedQuestionCitation } from '@/features/videos/types';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  citations?: GroundedQuestionCitation[];
}

type GlobalAiDrawerProps = {
  userId: string | undefined;
};

const formatCitationTimestamp = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export function GlobalAiDrawer({ userId }: GlobalAiDrawerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Context Selection States
  const [contextMode, setContextMode] = useState<'all' | 'selected'>('all');
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [isVideosLoading, setIsVideosLoading] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const storageKey = `streamforge_${userId || 'guest'}_global_chat_history`;

  // Listen to open event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('streamforge_open_global_ai_drawer', handleOpen);
    return () => window.removeEventListener('streamforge_open_global_ai_drawer', handleOpen);
  }, []);

  // Fetch all videos when selecting specific videos mode
  useEffect(() => {
    if (!isOpen) return;

    const fetchVideos = async () => {
      setIsVideosLoading(true);
      const response = await apiClient.getVideos({ page: 1, pageSize: 100 });
      if (response.success && response.data) {
        setAllVideos(response.data.items);
      }
      setIsVideosLoading(false);
    };

    void fetchVideos();
  }, [isOpen]);

  // Load chat history from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(storageKey);
      queueMicrotask(() => {
        if (stored) {
          setMessages(JSON.parse(stored));
        } else {
          setMessages([
            {
              id: 'welcome',
              sender: 'ai',
              text: 'Hello! I can answer questions across your entire video library. Ask me anything, and I will search the transcriptions and provide cross-video references.',
            },
          ]);
        }
      });
    } catch (e) {
      console.error('Failed to load global chat history:', e);
    }
  }, [storageKey]);

  // Persist chat history
  const saveMessages = (newMessages: Message[]) => {
    setMessages(newMessages);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(newMessages));
      } catch (e) {
        console.error('Failed to save global chat history:', e);
      }
    }
  };

  // Scroll to bottom
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    setInput('');

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: userMessageText,
    };

    const nextMessages = [...messages, userMsg];
    saveMessages(nextMessages);
    setIsLoading(true);

    const payload = {
      question: userMessageText,
      videoIds: contextMode === 'selected' ? selectedVideoIds : undefined,
    };

    const response = await apiClient.askCrossVideoQuestion(payload);

    setIsLoading(false);

    if (response.success && response.data) {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: response.data.answer || "I couldn't find any matching answers in the video library transcriptions.",
        citations: response.data.citations || undefined,
      };
      saveMessages([...nextMessages, aiMsg]);
    } else {
      toast.error(response.error || 'Failed to get answer from AI');
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear your global chat history?')) {
      const welcome: Message[] = [
        {
          id: 'welcome',
          sender: 'ai',
          text: 'Hello! I can answer questions across your entire video library. Ask me anything, and I will search the transcriptions and provide cross-video references.',
        },
      ];
      saveMessages(welcome);
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideoIds((current) =>
      current.includes(videoId)
        ? current.filter((id) => id !== videoId)
        : [...current, videoId]
    );
  };

  const handleCitationClick = (videoId: string, seconds: number) => {
    setIsOpen(false);
    router.push(`/videos/${videoId}?t=${seconds}`);
  };

  const filteredVideos = allVideos.filter((v) =>
    v.title.toLowerCase().includes(videoSearchQuery.toLowerCase())
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 border-l border-border bg-background text-left [&>button]:top-2.5 [&>button]:right-3 [&>button]:h-8 [&>button]:w-8 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:p-0 [&>button]:cursor-pointer [&>button]:hover:bg-accent [&>button]:hover:text-foreground [&>button]:text-muted-foreground [&>button]:rounded-md [&>button]:transition-colors">
        <SheetHeader className="relative p-4 border-b border-border flex flex-row items-center justify-between">
          <div className="flex items-center gap-1.5 text-primary">
            <Sparkles className="size-4 shrink-0" />
            <SheetTitle className="text-sm font-bold uppercase tracking-wider">Ask AI</SheetTitle>
          </div>
          {messages.length > 1 && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="absolute top-2.4 right-10 h-8 w-8 p-0 text-muted-foreground hover:text-destructive z-50 cursor-pointer flex items-center justify-center"
              onClick={handleClear}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </SheetHeader>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Context Selector */}
          <div className="p-4 border-b border-border space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Search Context</span>
              <span className="text-[9px] text-muted-foreground font-mono">
                {contextMode === 'all' ? 'Entire Library' : `${selectedVideoIds.length} video(s) selected`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setContextMode('all')}
                className={`py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                  contextMode === 'all'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border text-muted-foreground'
                }`}
              >
                <Layers className="size-3.5" />
                All Videos
              </button>
              <button
                type="button"
                onClick={() => setContextMode('selected')}
                className={`py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                  contextMode === 'selected'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border text-muted-foreground'
                }`}
              >
                <Check className="size-3.5" />
                Select Videos
              </button>
            </div>

            {/* Select Videos Checklist Panel */}
            {contextMode === 'selected' && (
              <div className="border border-border rounded bg-background p-2 space-y-2 max-h-36 flex flex-col min-h-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search videos..."
                    value={videoSearchQuery}
                    onChange={(e) => setVideoSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                  {isVideosLoading ? (
                    <div className="flex items-center justify-center gap-1.5 py-4 text-[10px] text-muted-foreground font-mono">
                      <Loader2 className="size-3 animate-spin" />
                      LOADING VIDEOS...
                    </div>
                  ) : filteredVideos.length > 0 ? (
                    filteredVideos.map((video) => {
                      const isChecked = selectedVideoIds.includes(video.id);
                      return (
                        <label
                          key={video.id}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/60 transition-colors text-xs cursor-pointer select-none"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleVideoSelection(video.id)}
                            className="cursor-pointer"
                          />
                          <span className="truncate text-foreground font-medium">{video.title}</span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-[10px] text-muted-foreground font-mono">
                      NO VIDEOS FOUND
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1.5 ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`rounded-lg px-3 py-2 max-w-[85%] leading-5 break-words text-xs ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Citations / Cross-Video References */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-1 flex flex-col gap-1.5 items-start pl-1 text-[11px]">
                    <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">References:</span>
                    {msg.citations.map((citation, index) => (
                      <button
                        key={citation.chunkId}
                        onClick={() => handleCitationClick(citation.videoId, citation.startSeconds)}
                        className="inline-flex items-center gap-1.5 text-left text-primary hover:text-primary/80 transition-colors font-mono py-0.5 cursor-pointer leading-tight"
                      >
                        <span className="bg-primary/10 border border-primary/20 rounded px-1 text-[9px] font-semibold">
                          [{index + 1}]
                        </span>
                        <span className="underline truncate max-w-[240px]">
                          &quot;{citation.videoTitle || 'Jump'}&quot;
                        </span>
                        <span className="text-muted-foreground font-semibold">
                          @ {formatCitationTimestamp(citation.startSeconds)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground p-2.5 bg-muted/30 rounded-lg max-w-[65%] text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                <span>Searching transcripts...</span>
              </div>
            )}
          </div>

          {/* Form input */}
          <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={contextMode === 'selected' ? `Ask about selected ${selectedVideoIds.length} video(s)...` : "Ask about any video..."}
              disabled={isLoading}
              className="flex-1 h-9 text-xs bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading || (contextMode === 'selected' && selectedVideoIds.length === 0)}
              className="h-9 w-9 p-0 shrink-0 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
