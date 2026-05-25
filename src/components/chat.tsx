'use client'

import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Message } from '@prisma/client'
import { updateSessionTitle } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { DefaultChatTransport } from 'ai'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Plus, Globe, Brain, Code, FileText, BarChart3, StopCircle, Send, Square, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatProps {
  sessionId?: string
  initialMessages?: Message[]
}

const MODELS = [
  { id: 'auto', label: 'Auto (Smart Route)' },
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Groq)' },
  { id: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (Groq)' },
  { id: 'gemma2-9b-it', label: 'Gemma 2 9B (Groq)' },
]

export function Chat({ sessionId, initialMessages = [] }: ChatProps) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState('auto')
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: {
      sessionId,
      model: selectedModel,
    },
  }), [sessionId, selectedModel])

  const { messages, sendMessage, status, stop } = useChat({
    messages: initialMessages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      parts: [{ type: 'text', text: m.content }],
    })),
    transport,
    onFinish: async () => {
      if (sessionId && messages.length === 2) {
        const firstMessageText = messages[0].parts.find(p => p.type === 'text')?.text
        if (firstMessageText) {
          await updateSessionTitle(sessionId, firstMessageText.substring(0, 30))
          router.refresh()
        }
      }
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) {
      stop()
      return
    }

    if (!input.trim()) return
    
    sendMessage({ text: input })
    setInput('')
  }

  const isNewChat = messages.length === 0

  const handleActionClick = (text: string) => {
    setInput(text)
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-zinc-300 font-sans">
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="max-w-2xl mx-auto w-full px-4 pt-32 pb-48">
            {isNewChat ? (
              <div className="flex flex-col items-center justify-center text-center space-y-3 mb-16 animate-in fade-in zoom-in-95 duration-1000">
                <h1 className="text-5xl font-serif font-medium text-zinc-100 tracking-tight leading-tight italic">
                  Hey Pavan<span className="text-zinc-700 not-italic">,</span>
                </h1>
                <h2 className="text-5xl font-serif font-medium text-zinc-600 tracking-tight leading-tight italic">
                  What&apos;s on your mind today?
                </h2>
              </div>
            ) : (
              <div className="space-y-12">
                {messages.map((m) => (
                  <div key={m.id} className="group animate-in fade-in slide-in-from-bottom-3 duration-500 py-2">
                    <div className="flex items-start gap-6">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] shrink-0 mt-1 ${
                        m.role === 'user' 
                          ? 'bg-zinc-800 text-zinc-500 border border-white/5' 
                          : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                      }`}>
                        {m.role === 'user' ? 'M' : '✦'}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                          {m.role === 'user' ? 'Pavan' : 'Cortex AI'}
                        </div>
                        <div className={`prose prose-invert prose-zinc max-w-none text-[17px] leading-relaxed selection:bg-orange-500/30 ${
                          m.role === 'user' ? 'text-zinc-200' : 'text-zinc-100'
                        }`}>
                          {m.parts.map((part, i) => (
                            <div key={i}>
                              {part.type === 'text' && (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {part.text}
                                </ReactMarkdown>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="fixed bottom-0 left-[280px] right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-32 pb-10 px-6">
        <div className="max-w-2xl mx-auto w-full">
          {isLoading && (
            <div className="flex justify-center mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => stop()}
                className="rounded-full bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white gap-2.5 h-9 px-5 backdrop-blur-md transition-all shadow-xl"
              >
                <StopCircle className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-medium">Stop Generation</span>
              </Button>
            </div>
          )}

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-zinc-500/10 to-orange-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-1000" />
            <div className="relative bg-[#121212] border border-white/5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 group-focus-within:border-white/10 group-focus-within:bg-[#141414]">
              <form onSubmit={handleSubmit} className="p-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  placeholder="Ask Cortex something..."
                  disabled={isLoading}
                  rows={1}
                  className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-[16px] py-6 px-6 placeholder:text-zinc-700 text-zinc-100 resize-none min-h-[76px]"
                />
                <div className="flex items-center justify-between px-4 pb-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-600 hover:text-zinc-300 rounded-xl hover:bg-white/5 transition-all">
                      <Plus className="h-4.5 w-4.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 px-3.5 text-zinc-600 hover:text-zinc-300 gap-2.5 rounded-xl text-[13px] font-medium hover:bg-white/5 transition-all">
                      <Globe className="h-4 w-4" />
                      Search
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-bold uppercase tracking-[0.15em] hover:text-zinc-400 transition-colors py-1"
                      >
                        {MODELS.find(m => m.id === selectedModel)?.label}
                        <ChevronDown className={cn("h-3 w-3 transition-transform", isModelDropdownOpen && "rotate-180")} />
                      </button>
                      
                      {isModelDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsModelDropdownOpen(false)} 
                          />
                          <div className="absolute bottom-full right-0 mb-4 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 backdrop-blur-xl">
                            <div className="p-1.5 space-y-0.5">
                              {MODELS.map((model) => (
                                <button
                                  key={model.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedModel(model.id)
                                    setIsModelDropdownOpen(false)
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-all hover:bg-white/5",
                                    selectedModel === model.id ? "text-orange-500 bg-orange-500/5" : "text-zinc-400"
                                  )}
                                >
                                  {model.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      disabled={!input.trim() && !isLoading}
                      className="h-9 w-9 bg-zinc-100 hover:bg-white text-black rounded-xl p-0 transition-all active:scale-90 shadow-lg shadow-white/5"
                    >
                      {isLoading ? (
                        <Square className="h-4 w-4 fill-current" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {isNewChat && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8 animate-in fade-in slide-in-from-top-2 duration-1000 delay-300">
              {[
                { icon: Brain, label: 'Run deep research', prompt: 'I want you to perform a deep research analysis on ' },
                { icon: Code, label: 'Help me code', prompt: 'I need help writing code for ' },
                { icon: FileText, label: 'Outline slides', prompt: 'Create a presentation outline for ' },
                { icon: BarChart3, label: 'Analyze data', prompt: 'Analyze this data for me: ' },
              ].map((action, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleActionClick(action.prompt)}
                  className="bg-[#121212]/50 border-white/5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 rounded-xl px-5 h-10 gap-2.5 text-[13px] font-medium transition-all hover:border-white/10 active:scale-95"
                >
                  <action.icon className="h-4 w-4 text-zinc-600" />
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
