import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export interface ShellInfo {
  command: string
  args: string[]
  label: string
}

export interface SpawnCommand {
  command: string
  args: string[]
}

const WINDOWS_CMD_EXTENSIONS = new Set(['.cmd', '.bat'])

function resolveShellFromEnv(): string | undefined {
  const shell = process.env.SHELL?.trim()
  if (shell && existsSync(shell)) {
    return shell
  }
  return undefined
}

function resolveWindowsShell(): ShellInfo {
  const pwshPaths = [
    join(process.env.ProgramFiles ?? 'C:\\Program Files', 'PowerShell', '7', 'pwsh.exe'),
    join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'PowerShell', '7', 'pwsh.exe'),
    'pwsh.exe',
  ]

  for (const candidate of pwshPaths) {
    if (candidate.endsWith('.exe') && !existsSync(candidate)) {
      continue
    }
    return { command: candidate, args: [], label: 'PowerShell 7' }
  }

  const systemRoot = process.env.SystemRoot ?? 'C:\\Windows'
  const powershell = join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
  return {
    command: existsSync(powershell) ? powershell : 'powershell.exe',
    args: [],
    label: 'Windows PowerShell',
  }
}

function resolveUnixShell(): ShellInfo {
  const fromEnv = resolveShellFromEnv()
  if (fromEnv) {
    const name = fromEnv.split('/').pop() ?? fromEnv
    return { command: fromEnv, args: [], label: name }
  }

  if (process.platform === 'darwin') {
    const zsh = '/bin/zsh'
    if (existsSync(zsh)) {
      return { command: zsh, args: [], label: 'zsh' }
    }
  }

  const bash = '/bin/bash'
  if (existsSync(bash)) {
    return { command: bash, args: [], label: 'bash' }
  }

  return { command: '/bin/sh', args: [], label: 'sh' }
}

export function getDefaultShell(): ShellInfo {
  if (process.platform === 'win32') {
    return resolveWindowsShell()
  }
  return resolveUnixShell()
}

function resolveExecutableInPath(name: string): string | undefined {
  if (process.platform === 'win32') {
    try {
      const output = execFileSync('where.exe', [name], { encoding: 'utf8' }).trim()
      const match = output.split(/\r?\n/).map((line) => line.trim()).find(Boolean)
      return match && existsSync(match) ? match : undefined
    } catch {
      return undefined
    }
  }

  const pathEntries = (process.env.PATH ?? '').split(':').filter(Boolean)
  for (const entry of pathEntries) {
    const candidate = join(entry, name)
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return undefined
}

function wrapCommandThroughShell(shell: ShellInfo, command: string): SpawnCommand {
  if (shell.command.toLowerCase().includes('powershell')) {
    return {
      command: shell.command,
      args: ['-NoLogo', '-NoProfile', '-Command', command],
    }
  }

  const comspec = process.env.ComSpec ?? join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'cmd.exe')
  return {
    command: existsSync(comspec) ? comspec : 'cmd.exe',
    args: ['/c', command],
  }
}

/** Windows ConPTY 需要真实可执行文件；npm 全局的 claude 多为 .cmd，需经 shell 解析 PATH */
export function resolveClaudeSpawn(shell: ShellInfo): SpawnCommand {
  if (process.platform !== 'win32') {
    return { command: 'claude', args: [] }
  }

  const resolved = resolveExecutableInPath('claude')
  if (resolved) {
    const ext = resolved.slice(resolved.lastIndexOf('.')).toLowerCase()
    if (!WINDOWS_CMD_EXTENSIONS.has(ext)) {
      return { command: resolved, args: [] }
    }
  }

  return wrapCommandThroughShell(shell, 'claude')
}

export function buildShellEnv(cwd: string): NodeJS.ProcessEnv {
  const env = { ...process.env }
  env.TERM = 'xterm-256color'
  env.COLORTERM = 'truecolor'
  env.PWD = cwd

  if (process.platform !== 'win32') {
    env.HOME = env.HOME ?? homedir()
  }

  return env
}
