'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlusCircle, Search, Library, ChevronDown, PanelLeft, Trash2, Edit2, Check, X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { deleteSession, renameSession } from '@/app/actions'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Session {
  id: string
  title: string
  _count: {
    messages: number
  }
}

export function SidebarClient({ initialSessions }: { initialSessions: Session[] }) {
  const router = useRouter()
  const params = useParams()
  const currentId = params?.id as string
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditingTitle] = useState('')

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Delete this chat?')) {
      await deleteSession(id)
      if (currentId === id) {
        router.push('/')
      }
    }
  }

  const startRename = (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingId(id)
    setEditingTitle(title)
  }

  const handleRename = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (editTitle.trim()) {
      await renameSession(id, editTitle)
      setEditingId(null)
    }
  }

  const cancelRename = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingId(null)
  }

  return (
    <div className="flex flex-col h-full w-[280px] bg-[#0f0f0f] border-r border-white/5 text-zinc-400">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-semibold text-zinc-100">
          <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-[14px] text-black">
            ✦
          </div>
          <span className="text-[17px] tracking-tight">Cortex AI</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-100 hover:bg-white/5">
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-4 space-y-1">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start hover:bg-white/5 hover:text-zinc-100 group px-2 h-10 transition-all">
            <div className="flex items-center gap-3">
              <PlusCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">New chat</span>
            </div>
          </Button>
        </Link>
      </div>

      <div className="mt-6 flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-0.5 pb-4">
            {initialSessions.map((session) => (
              <div key={session.id} className="group relative">
                {editingId === session.id ? (
                  <div className="flex items-center gap-1 px-2 h-8 bg-white/5 rounded-md">
                    <input
                      autoFocus
                      className="flex-1 bg-transparent text-xs border-0 outline-none text-zinc-200"
                      value={editTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(e as any, session.id)
                        if (e.key === 'Escape') cancelRename(e as any)
                      }}
                    />
                    <button onClick={(e) => handleRename(e, session.id)} className="text-zinc-400 hover:text-orange-500">
                      <Check className="h-3 w-3" />
                    </button>
                    <button onClick={cancelRename} className="text-zinc-400 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="relative group">
                    <Link 
                      href={`/chat/${session.id}`}
                      className={cn(
                        "flex items-center w-full text-xs font-normal h-8 px-2 rounded-md hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-all truncate",
                        currentId === session.id && "bg-white/5 text-zinc-100"
                      )}
                    >
                      <span className="truncate opacity-70 group-hover:opacity-100 pr-12">{session.title}</span>
                    </Link>
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a1a1a]/90 backdrop-blur-sm pl-2 rounded-md z-10">
                      <button 
                        onClick={(e) => startRename(e, session.id, session.title)}
                        className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, session.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
