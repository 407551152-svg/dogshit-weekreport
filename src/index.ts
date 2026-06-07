#!/usr/bin/env node

import { resolve } from 'node:path'
import { startTerminalServer } from './server.js'

function parseArgs(argv: string[]): { cwd: string; port?: number } {
  const args = [...argv]
  let cwd = process.cwd()
  let port: number | undefined

  while (args.length > 0) {
    const arg = args.shift()
    if (!arg) {
      break
    }

    if (arg === '--cwd' && args[0]) {
      cwd = resolve(args.shift()!)
      continue
    }

    if (arg === '--port' && args[0]) {
      const parsed = Number.parseInt(args.shift()!, 10)
      if (!Number.isNaN(parsed) && parsed > 0) {
        port = parsed
      }
      continue
    }

    if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    }
  }

  return { cwd, port }
}

function printHelp(): void {
  console.log(`weekreport-term — 浏览器内项目终端

用法:
  weekreport-term [--cwd <path>] [--port <number>]

选项:
  --cwd   终端工作目录，默认为当前目录
  --port  监听端口，默认自动分配
  -h      显示帮助
`)
}

async function main(): Promise<void> {
  const { cwd, port } = parseArgs(process.argv.slice(2))
  const handle = await startTerminalServer({ cwd, port })

  console.log('')
  console.log('  项目终端已启动')
  console.log(`  工作目录: ${handle.cwd}`)
  console.log(`  Shell:    ${handle.shell.label}`)
  console.log(`  打开:     ${handle.url}`)
  console.log('')
  console.log('  按 Ctrl+C 停止服务')
  console.log('')

  const shutdown = async () => {
    await handle.close()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((error: unknown) => {
  console.error('启动失败:', error)
  process.exit(1)
})
