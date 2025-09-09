// Simple in-memory store for sessions (valid for warm container lifetime)
export type StoredSession = {
  sessionId: string
  createdAt: string
  quiz: any
  recommendations: any[]
}

const sessions = new Map<string, StoredSession>()

export function saveSession(s: StoredSession) {
  sessions.set(s.sessionId, s)
}

export function getSession(id: string): StoredSession | undefined {
  return sessions.get(id)
}

