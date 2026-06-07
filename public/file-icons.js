const FILE_ICON_DEFS = {
  folder: {
    color: '#c09553',
    path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  },
  folderOpen: {
    color: '#c09553',
    path: 'M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 6H5v-2h14v2z',
  },
  file: {
    color: '#90a4ae',
    path: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z',
  },
  markdown: {
    color: '#519aba',
    path: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
  },
  css: {
    color: '#42a5f5',
    path: 'M5 3 4.35 6.34h1.71L7.5 8.5H4.72L4 11.5h7.73V9.5H8.78L8.19 7h3.04L12.88 3H5zm14 0h-4.69L13.66 6.34h1.71l-.22 1.12H13.5l-.65 3.34h1.71l-.22 1.12H12l-.65 3.34h7.73l.65-3.34h-1.71l.22-1.12h1.71l.65-3.34h-1.71l.22-1.12h1.71L19 3z',
  },
  js: {
    color: '#f7df1e',
    path: 'M3 3h18v18H3V3zm10.83 13.92c.48.9 1.45 1.54 2.64 1.54 1.62 0 2.64-1.02 2.64-2.42V9.88h-2.1v5.84c0 .66-.45 1.12-1.12 1.12-.66 0-1.02-.36-1.28-.84l-1.88 1.14zm-4.02-.06c.45.84 1.38 1.44 2.52 1.44 1.56 0 2.46-.96 2.46-2.28V9.88H12.3v5.7c0 .6-.42 1.02-1.02 1.02-.6 0-.96-.3-1.2-.72l-1.47 1.08z',
  },
  html: {
    color: '#e44d26',
    path: 'M12 18l4.74-6H12V9.27L7.58 15.59 12 18m0-16A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z',
  },
  ts: {
    color: '#3178c6',
    path: 'M3 3h18v18H3V3zm12.57 14.57c.57 1.05 1.71 1.86 3.35 1.86 2.3 0 3.35-1.43 3.35-3.17V9.89h-2.02v6.15c0 .77-.57 1.25-1.25 1.25-.77 0-1.25-.38-1.54-.86l-1.8 1.09zm-5.14-.05c.57 1.05 1.63 1.86 3.08 1.86 1.91 0 2.97-1.15 2.97-2.78V9.89h-2.02v6.01c0 .67-.48 1.1-1.1 1.1-.67 0-1.05-.38-1.34-.82l-1.59 1.24z',
  },
  json: {
    color: '#cbcb41',
    path: 'M8 6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h1v-2H8V8h1V6H8zm8 0h-1v2h1v6h-1v2h1c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 4H10v2h4v-2z',
  },
  git: {
    color: '#f05032',
    path: 'M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7z',
  },
  gitignore: {
    color: '#8b949e',
    path: 'M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 9H6v-2h8v2zm4 0h-2v-2h2v2z',
  },
}

const FILE_ICON_RULES = [
  { match: (name) => name === '.gitignore', icon: 'gitignore' },
  { match: (name) => /^\.git/i.test(name) && name !== '.gitignore', icon: 'git' },
  { match: (name) => /\.mdx?$/i.test(name), icon: 'markdown' },
  { match: (name) => /\.markdown$/i.test(name), icon: 'markdown' },
  { match: (name) => /\.tsx?$/i.test(name), icon: 'ts' },
  { match: (name) => /\.json$/i.test(name), icon: 'json' },
  { match: (name) => /\.css$/i.test(name), icon: 'css' },
  { match: (name) => /\.m?js$/i.test(name), icon: 'js' },
  { match: (name) => /\.html?$/i.test(name), icon: 'html' },
]

const DIRECTORY_ICON_RULES = [
  { match: (name) => name === '.git', icon: 'git' },
]

function resolveFileIconName(fileName) {
  for (const rule of FILE_ICON_RULES) {
    if (rule.match(fileName)) {
      return rule.icon
    }
  }
  return 'file'
}

function resolveDirectoryIconName(dirName, expanded) {
  for (const rule of DIRECTORY_ICON_RULES) {
    if (rule.match(dirName)) {
      return rule.icon
    }
  }
  return getDirectoryIconName(expanded)
}

function renderFileIcon(iconName) {
  const icon = FILE_ICON_DEFS[iconName] ?? FILE_ICON_DEFS.file
  return `<svg class="tree-icon-svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style="color:${icon.color}"><path fill="currentColor" d="${icon.path}"/></svg>`
}

function getDirectoryIconName(expanded) {
  return expanded ? 'folderOpen' : 'folder'
}
