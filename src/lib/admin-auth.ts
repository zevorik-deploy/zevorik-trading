import { db } from '@/lib/db'

export async function verifyAdmin(userId: string): Promise<boolean> {
  if (!userId) return false
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

export function getUserId(request: Request): string {
  const url = new URL(request.url)
  return request.headers.get('x-user-id') || url.searchParams.get('userId') || ''
}
