'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, X, Trash2, Send, Sparkles } from 'lucide-react';
import { apiClient } from '@/shared/lib/api';
import { GroundedQuestionCitation } from '@/features/videos/types';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  citations?: GroundedQuestionCitation[];
}

type VideoAiPanelProps = {
  videoId: string;
  userId: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSeek: (seconds: number) => void;
  shareToken?: string;
};

const formatCitationTimestamp = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export function VideoAiPanel({
  videoId,
  userId,
  isOpen,
  onClose,
  onSeek,
  shareToken,
}: VideoAiPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const storageKey = `streamforge_${userId || 'guest'}_video_${videoId}_chat_history`;

  // Load chat history from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(storageKey);
      queueMicrotask(() => {
        if (stored) {
          setMessages(JSON.parse(stored));
        } else {
          // Initial welcome message
          setMessages([
            {
              id: 'welcome',
              sender: 'ai',
              text: 'Hello! I am your AI assistant for this video. Ask me anything about what is being said, and I will find the answers and timestamps for you.',
            },
          ]);
        }
      });
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
  }, [storageKey]);

  // Persist chat history to localStorage
  const saveMessages = (newMessages: Message[]) => {
    setMessages(newMessages);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(newMessages));
      } catch (e) {
        console.error('Failed to save chat history:', e);
      }
    }
  };

  // Scroll to bottom on new messages
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

    const response = await apiClient.askVideoQuestion(
      videoId,
      { question: userMessageText },
      { shareToken }
    );

    setIsLoading(false);

    if (response.success && response.data) {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: response.data.answer || "I couldn't find an answer to that question in the video.",
        citations: response.data.citations || undefined,
      };
      saveMessages([...nextMessages, aiMsg]);
    } else {
      toast.error(response.error || 'Failed to get answer from AI');
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear your chat history for this video?')) {
      const welcome: Message[] = [
        {
          id: 'welcome',
          sender: 'ai',
          text: 'Hello! I am your AI assistant for this video. Ask me anything about what is being said, and I will find the answers and timestamps for you.',
        },
      ];
      saveMessages(welcome);
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="border border-border bg-card shadow-sm text-left animate-in fade-in duration-200">
      <CardContent className="space-y-4 py-0 px-5">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-1.5 text-primary">
            <Sparkles className="size-3.5" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Ask AI</h3>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                onClick={handleClear}
                aria-label="Clear chat"
                title="Clear chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              onClick={onClose}
              aria-label="Close AI panel"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Scrollable messages container */}
        <div
          ref={scrollContainerRef}
          className="max-h-72 overflow-y-auto space-y-4 pr-1 text-xs"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`rounded-lg px-3 py-2 max-w-[85%] leading-5 break-words ${
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

              {/* Citations List */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">References:</span>
                  {msg.citations.map((citation, index) => (
                    <button
                      key={citation.chunkId}
                      onClick={() => onSeek(citation.startSeconds)}
                      className="inline-flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                      title={citation.content || 'Jump to segment'}
                    >
                      [{index + 1}] {formatCitationTimestamp(citation.startSeconds)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground p-2 bg-muted/30 rounded-lg max-w-[60%]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Thinking...</span>
            </div>
          )}
        </div>

        {/* Input prompt form */}
        <form onSubmit={handleSend} className="flex gap-2 border-t border-border pt-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this video..."
            disabled={isLoading}
            className="flex-1 h-8 text-xs bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isLoading}
            className="h-8 w-8 p-0 shrink-0 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
