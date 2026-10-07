'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export default function PortalChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content, history: messages }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request.',
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-headline-sm font-bold text-on-surface">AgentForge Assistant</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Secure, tenant-isolated AI</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[32px] text-primary">smart_toy</span>
            </div>
            <h2 className="text-headline-md font-bold text-on-surface mb-2">How can I help you today?</h2>
            <p className="text-on-surface-variant text-sm">
              I am your dedicated AI assistant. I have access to your organization's specific knowledge base and can help answer questions or execute workflows.
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-surface-container-high' : 'bg-primary text-on-primary'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {msg.role === 'user' ? 'person' : 'smart_toy'}
                  </span>
                </div>
                
                {/* Bubble */}
                <div className={`px-4 py-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-surface-container-highest text-on-surface rounded-tr-sm' 
                    : 'bg-primary/10 text-on-surface rounded-tl-sm border border-primary/20'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">smart_toy</span>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-primary/10 rounded-tl-sm border border-primary/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/20 shrink-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Message AgentForge..."
              className="w-full pl-4 pr-12 py-3.5 bg-surface rounded-xl border border-outline-variant/50 focus:border-primary focus:outline-none shadow-sm text-on-surface"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-on-surface-variant">AI can make mistakes. Verify important information.</span>
          </div>
        </div>
      </div>
    </div>
  );
}