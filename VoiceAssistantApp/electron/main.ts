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

import fs from "node:fs";
import os from "node:os";
import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import crypto from "node:crypto";


const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env from the project root (one level up from dist-electron/)
dotenv.config({ path: path.join(__dirname, '..', '.env') })
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {

  win = new BrowserWindow({
    width: 1200,
    height: 900,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
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

// - Persistent Python Worker Logic
let worker: ChildProcessWithoutNullStreams | null = null;
const pending = new Map<
  string,
  { resolve: (text: string) => void; reject: (err: Error) => void }
>();

function getPythonExe() {
  const root = app.getAppPath(); // more stable than cwd in Electron
  if (process.platform === "win32") {
    return path.join(root, "python", ".venv", "Scripts", "python.exe");
  }
  // mac/linux
  const py = path.join(root, "python", ".venv", "bin", "python");
  const py3 = path.join(root, "python", ".venv", "bin", "python3");
  return fs.existsSync(py) ? py : py3;
}

function getWorkerScript() {
  const root = app.getAppPath();
  return path.join(root, "python", "worker.py");
}

function ensureWorker() {
  if (worker && !worker.killed) return;

  const python = getPythonExe();
  const script = getWorkerScript();

  if (!fs.existsSync(python)) {
    throw new Error(`Python not found at: ${python}`);
  }
  if (!fs.existsSync(script)) {
    throw new Error(`Worker script not found at: ${script}`);
  }

  worker = spawn(python, [script], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Debug: see worker stderr in your terminal
  console.log("py-worker initiated");
  worker.stderr.on("data", (d) => {
    console.error("[py-worker stderr]", d.toString());
  });

  // Parse JSON-lines from stdout
  let buf = "";
  worker.stdout.on("data", (d) => {
    buf += d.toString();
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;

      try {
        const msg = JSON.parse(line);
        const job = pending.get(msg.id);
        if (!job) continue;

        pending.delete(msg.id);

        if (msg.ok) job.resolve(msg.text ?? "");
        else job.reject(new Error(msg.error || "Worker error"));
      } catch (e) {
        console.error("Failed to parse worker line:", line);
      }
    }
  });

  worker.on("exit", (code) => {
    console.error("[py-worker] exited with code", code);
    // Reject any pending requests
    for (const [id, job] of pending) {
      job.reject(new Error("Python worker exited"));
      pending.delete(id);
    }
    worker = null;
  });
}

function transcribeViaWorker(wavPath: string): Promise<string> {
  ensureWorker();
  const id = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });

    const payload = JSON.stringify({ id, path: wavPath }) + "\n";
    worker!.stdin.write(payload, "utf8", (err) => {
      if (err) {
        pending.delete(id);
        reject(err);
      }
    });
  });
}

// ── STT IPC Handlers ──────────────────────────────────────────────
ipcMain.handle("stt:transcribeWav", async (_event, wavBytes: ArrayBuffer) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ptt-"));
  const wavPath = path.join(tmpDir, "audio.wav");

  fs.writeFileSync(wavPath, Buffer.from(wavBytes));

  try {
    console.time("transcription");

    const text = await transcribeViaWorker(wavPath);

    console.timeEnd("transcription");

    console.log("TRANSCRIBED:", text);

    return { text };
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { }
  }
});

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
    ensureWorker();
    await initChroma()
  } catch (err) {
    console.error(err);
    console.warn('[chroma] Could not connect to ChromaDB server — is it running?', err)
  }

  createWindow()
})
