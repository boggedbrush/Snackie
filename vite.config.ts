import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function devApiPlugin() {
  return {
    name: 'dev-api-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url: string = req.url || ''
        if (!url.startsWith('/api/')) return next()

        try {
          // Build a Fetch Request from Node req
          const origin = `http://${req.headers.host || 'localhost'}`
          const fullUrl = origin + url
          const headers = new Headers()
          for (const [k, v] of Object.entries(req.headers)) {
            if (Array.isArray(v)) headers.set(k, v.join(','))
            else if (typeof v === 'string') headers.set(k, v)
          }
          let body: Buffer | undefined
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            body = await new Promise<Buffer>((resolve, reject) => {
              const chunks: Buffer[] = []
              req.on('data', (d: any) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)))
              req.on('end', () => resolve(Buffer.concat(chunks)))
              req.on('error', reject)
            })
          }
          const nodeReq = new Request(fullUrl, { method: req.method, headers, body })

          // Route to API handlers
          let handler: any
          if (url.startsWith('/api/health')) handler = (await import('./api/health.ts')).default
          else if (url.startsWith('/api/snacks')) handler = (await import('./api/snacks.ts')).default
          else if (url.startsWith('/api/quiz')) handler = (await import('./api/quiz.ts')).default
          else if (url.startsWith('/api/session/')) handler = (await import('./api/session/[id].ts')).default
          else return next()

          const response: Response = await handler(nodeReq)
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          const ab = await response.arrayBuffer()
          res.end(Buffer.from(ab))
        } catch (err) {
          server.ssrFixStacktrace?.(err)
          next(err)
        }
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), devApiPlugin()],
})
