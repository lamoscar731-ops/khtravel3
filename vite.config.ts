
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import aiHandler from './api/ai'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.OPENAI_API_KEY ||= env.OPENAI_API_KEY
  process.env.OPENAI_MODEL ||= env.OPENAI_MODEL

  return {
    plugins: [
      react(),
      {
        name: 'local-ai-api',
        configureServer(server) {
          server.middlewares.use('/api/ai', (req, res) => {
            let rawBody = ''
            req.on('data', (chunk) => { rawBody += chunk })
            req.on('end', async () => {
              try {
                ;(req as any).body = rawBody ? JSON.parse(rawBody) : {}
                await aiHandler(req as any, {
                  status(code: number) { res.statusCode = code; return this },
                  json(value: unknown) {
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify(value))
                  },
                  setHeader(name: string, value: string) { res.setHeader(name, value) },
                })
              } catch {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Invalid JSON body.' }))
              }
            })
          })
        },
      },
    ],
  }
})

