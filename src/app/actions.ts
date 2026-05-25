'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createSession(title: string) {
  const session = await prisma.session.create({
    data: {
      title,
    },
  })
  return session
}

export async function getSessions() {
  return await prisma.session.findMany({
    include: {
      _count: {
        select: { messages: true }
      }
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function deleteSession(id: string) {
  await prisma.session.delete({
    where: { id },
  })
  revalidatePath('/')
}

export async function renameSession(id: string, title: string) {
  const session = await prisma.session.update({
    where: { id },
    data: { title },
  })
  revalidatePath('/')
  return session
}

export async function getSession(id: string) {
  return await prisma.session.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })
}

export async function saveMessage(sessionId: string, role: string, content: string) {
  const message = await prisma.message.create({
    data: {
      sessionId,
      role,
      content,
    },
  })
  revalidatePath(`/chat/${sessionId}`)
  return message
}

export async function updateSessionTitle(id: string, title: string) {
  const session = await prisma.session.update({
    where: { id },
    data: { title },
  })
  revalidatePath('/')
  return session
}
