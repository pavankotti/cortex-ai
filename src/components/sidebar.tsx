import { getSessions } from '@/app/actions'
import { SidebarClient } from './sidebar-client'

export async function Sidebar() {
  const sessions = await getSessions()

  // Ensure sessions match the interface expected by SidebarClient
  const formattedSessions = sessions.map(s => ({
    id: s.id,
    title: s.title,
    _count: s._count
  }))

  return <SidebarClient initialSessions={formattedSessions} />
}
