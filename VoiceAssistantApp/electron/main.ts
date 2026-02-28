import dotenv from 'dotenv'
import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  initChroma,
  addCommand,
  queryCommands,
  getCommand,
  deleteCommand,
  getAllCommands,
} from './chromaService'
import { generateFunction } from './llmService'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env from the project root (one level up from dist-electron/)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// ── ChromaDB IPC Handlers ──────────────────────────────────────────────
ipcMain.handle('chroma:addCommand', async (_e, id: string, description: string, regexPhrases: string[]) => {
  return addCommand(id, description, regexPhrases)
})

ipcMain.handle('chroma:queryCommands', async (_e, text: string, nResults?: number, distanceThreshold?: number) => {
  return queryCommands(text, nResults, distanceThreshold)
})

ipcMain.handle('chroma:getCommand', async (_e, id: string) => {
  return getCommand(id)
})

ipcMain.handle('chroma:deleteCommand', async (_e, id: string) => {
  return deleteCommand(id)
})

ipcMain.handle('chroma:getAllCommands', async () => {
  return getAllCommands()
})

ipcMain.handle('chroma:generateAndStore', async (_e, text: string, nResults?: number, distanceThreshold?: number) => {
  // 1. Check if something close already exists
  const queryResult = await queryCommands(text, nResults, distanceThreshold)
  if (queryResult.matched) {
    return { generated: false, ...queryResult }
  }

  // 2. Nothing close — ask the LLM to generate a function
  const descriptor = await generateFunction(text)

  // 3. Store it in ChromaDB so future queries match
  await addCommand(descriptor.function_id, descriptor.function_desc, descriptor.regex_phrases)
  console.log(`[main] Generated and stored new function "${descriptor.function_id}"`)

  return { generated: true, descriptor }
})

// ── App Lifecycle ──────────────────────────────────────────────────────
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(async () => {
  // Initialise ChromaDB (fails gracefully if server isn't running)
  try {
    await initChroma()
  } catch (err) {
    console.warn('[chroma] Could not connect to ChromaDB server — is it running?', err)
  }

  createWindow()
})
