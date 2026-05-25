import { createSession, getSessions } from './actions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const sessions = await getSessions()
  
  // Find an existing session that is titled "New Chat" and has 0 messages
  const existingEmptySession = sessions.find(
    (s) => s.title === 'New Chat' && s._count.messages === 0
  )

  if (existingEmptySession) {
    redirect(`/chat/${existingEmptySession.id}`)
  }

  const session = await createSession('New Chat')
  redirect(`/chat/${session.id}`)
}
