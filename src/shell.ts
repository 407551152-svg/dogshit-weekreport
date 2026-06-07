import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export interface ShellInfo {
  command: string
  args: string[]
  label: string
}

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
