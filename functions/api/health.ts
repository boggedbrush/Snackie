import handler from '../../api/health.ts'

export const onRequest = async ({ request }: any) => {
  return handler(request as Request)
}

