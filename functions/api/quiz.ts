import handler from '../../api/quiz.ts'
import { setCacheTtl } from '../../api/_images'

export const onRequest = async (context: any) => {
  setCacheTtl(Number(context?.env?.CACHE_TTL) || 300000)
  return handler(context.request as Request)
}

