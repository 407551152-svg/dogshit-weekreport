import { createServer, type Server } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import type { IPty } from 'node-pty'
import * as pty from 'node-pty'
import { WebSocketServer, type WebSocket } from 'ws'
import { buildShellEnv, getDefaultShell } from './shell.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface TerminalServerOptions {
  cwd: string
  port?: number
  host?: string
}

export interface TerminalServerHandle {
  url: string
  port: number
  cwd: string
  shell: ReturnType<typeof getDefaultShell>
  close: () => Promise<void>
}

interface ClientMessage {
  type: 'input' | 'resize'
  data?: string
  cols?: number
  rows?: number
}

function resolvePublicDir(): string {
  const bundled = join(__dirname, '..', 'public')
  if (bundled.endsWith('dist')) {
    return join(__dirname, '..', 'public')
  }
  return join(__dirname, '..', 'public')
}

function attachTerminal(ws: WebSocket, cwd: string, shell: ReturnType<typeof getDefaultShell>): () => void {
  let ptyProcess: IPty | null = null

  const dispose = () => {
    if (ptyProcess) {
      ptyProcess.kill()
      ptyProcess = null
    }
  }

  ptyProcess = pty.spawn(shell.command, shell.args, {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd,
    env: buildShellEnv(cwd) as Record<string, string>,
  })

  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }))
    }
  })

  ptyProcess.onExit(({ exitCode }) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'exit', exitCode }))
      ws.close()
    }
    ptyProcess = null
  })

  ws.on('message', (raw) => {
    if (!ptyProcess) {
      return
    }

    let message: ClientMessage
    try {
      message = JSON.parse(String(raw)) as ClientMessage
    } catch {
      return
    }

    if (message.type === 'input' && typeof message.data === 'string') {
      ptyProcess.write(message.data)
      return
    }

    if (
      message.type === 'resize'
      && typeof message.cols === 'number'
      && typeof message.rows === 'number'
      && message.cols > 0
      && message.rows > 0
    ) {
      ptyProcess.resize(message.cols, message.rows)
    }
  })

  ws.on('close', dispose)
  ws.on('error', dispose)

  ws.send(
    JSON.stringify({
      type: 'ready',
      cwd,
      shell: shell.label,
      platform: process.platform,
    }),
  )

  return dispose
}

export async function startTerminalServer(options: TerminalServerOptions): Promise<TerminalServerHandle> {
  const cwd = options.cwd
  const host = options.host ?? '127.0.0.1'
  const shell = getDefaultShell()
  const app = express()
  const publicDir = resolvePublicDir()

  app.get('/api/info', (_req, res) => {
    res.json({
      cwd,
      shell: shell.label,
      platform: process.platform,
    })
  })

  app.use(express.static(publicDir))

  app.get('*', (_req, res) => {
    res.sendFile(join(publicDir, 'index.html'))
  })

  const server: Server = createServer(app)
  const wss = new WebSocketServer({ server, path: '/ws' })
  const cleanups = new Set<() => void>()

  wss.on('connection', (ws) => {
    const cleanup = attachTerminal(ws, cwd, shell)
    cleanups.add(cleanup)
    ws.on('close', () => {
      cleanups.delete(cleanup)
    })
  })

  const port = await new Promise<number>((resolve, reject) => {
    server.once('error', reject)
    server.listen(options.port ?? 0, host, () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to resolve server port'))
        return
      }
      resolve(address.port)
    })
  })

  const url = `http://${host}:${port}`

  return {
    url,
    port,
    cwd,
    shell,
    close: () =>
      new Promise((resolve, reject) => {
        for (const cleanup of cleanups) {
          cleanup()
        }
        wss.close((wssError) => {
          if (wssError) {
            reject(wssError)
            return
          }
          server.close((serverError) => {
            if (serverError) {
              reject(serverError)
              return
            }
            resolve()
          })
        })
      }),
  }
}
