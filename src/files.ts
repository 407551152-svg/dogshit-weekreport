import { lstat, readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist'])
const MAX_FILE_BYTES = 1024 * 1024

export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
}

export class FileAccessError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'FileAccessError'
  }
}

function normalizeRelativePath(input: string): string {
  const trimmed = input.trim().replace(/\\/g, '/')
  if (!trimmed || trimmed === '.') {
    return ''
  }
  return trimmed.replace(/^\/+/, '')
}

export function resolveProjectPath(root: string, relativePath: string): string {
  const normalized = normalizeRelativePath(relativePath)
  const absolute = resolve(root, normalized || '.')
  const rel = relative(root, absolute)

  if (rel.startsWith('..') || rel.split(sep).includes('..')) {
    throw new FileAccessError('路径超出项目范围', 403)
  }

  return absolute
}

export async function listDirectory(root: string, relativePath = ''): Promise<FileEntry[]> {
  const absolute = resolveProjectPath(root, relativePath)
  const stat = await lstat(absolute).catch(() => {
    throw new FileAccessError('目录不存在', 404)
  })

  if (!stat.isDirectory()) {
    throw new FileAccessError('目标不是目录', 400)
  }

  const names = await readdir(absolute)
  const entries: FileEntry[] = []

  for (const name of names) {
    if (!relativePath && IGNORED_DIRS.has(name)) {
      continue
    }

    const childAbsolute = join(absolute, name)
    const childStat = await lstat(childAbsolute)
    const childRelative = relative(root, childAbsolute).split(sep).join('/')

    entries.push({
      name,
      path: childRelative,
      type: childStat.isDirectory() ? 'directory' : 'file',
    })
  }

  entries.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })

  return entries
}

export interface FileContent {
  path: string
  content: string
  size: number
  binary: boolean
}

export async function readProjectFile(root: string, relativePath: string): Promise<FileContent> {
  if (!relativePath.trim()) {
    throw new FileAccessError('缺少文件路径', 400)
  }

  const absolute = resolveProjectPath(root, relativePath)
  const stat = await lstat(absolute).catch(() => {
    throw new FileAccessError('文件不存在', 404)
  })

  if (!stat.isFile()) {
    throw new FileAccessError('目标不是文件', 400)
  }

  if (stat.size > MAX_FILE_BYTES) {
    throw new FileAccessError(`文件过大（>${MAX_FILE_BYTES / 1024 / 1024}MB）`, 413)
  }

  const buffer = await readFile(absolute)
  const binary = buffer.includes(0)

  return {
    path: relative(root, absolute).split(sep).join('/'),
    content: binary ? '' : buffer.toString('utf8'),
    size: stat.size,
    binary,
  }
}
