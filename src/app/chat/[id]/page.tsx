import { getSession } from '@/app/actions'
import { Chat } from '@/components/chat'
import { notFound } from 'next/navigation'

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;
  const session = await getSession(id)

  if (!session) {
    notFound()
  }

  return (
    <div className="h-full">
      <Chat sessionId={session.id} initialMessages={session.messages} />
    </div>
  )
}
