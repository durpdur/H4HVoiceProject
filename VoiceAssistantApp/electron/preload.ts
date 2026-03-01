import { ipcRenderer, contextBridge } from 'electron'
import type { FunctionDescriptor } from '../src/types/FunctionDescriptor';

// --------- Speech to Text API ---------
contextBridge.exposeInMainWorld("stt", {
  transcribeWav: (wavBytes: ArrayBuffer) => ipcRenderer.invoke("stt:transcribeWav", wavBytes),
});

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// --------- ChromaDB API for the Renderer process ---------
contextBridge.exposeInMainWorld('chromaAPI', {
  // Create / Update (stores all fields, embeds only function_desc)
  upsertFunction: (fd: FunctionDescriptor): Promise<void> =>
    ipcRenderer.invoke('chroma:upsertFunction', fd),

  // Read one
  getFunction: (id: string): Promise<FunctionDescriptor | null> =>
    ipcRenderer.invoke('chroma:getFunction', id),

  // Read all
  listFunctions: (): Promise<FunctionDescriptor[]> =>
    ipcRenderer.invoke('chroma:listFunctions'),

  // Delete
  deleteFunction: (id: string): Promise<void> =>
    ipcRenderer.invoke('chroma:deleteFunction', id),

  // Vector search
  searchFunctions: (
    text: string,
    nResults?: number,
    distanceThreshold?: number
  ): Promise<{
    matched: boolean
    results: Array<{ fd: FunctionDescriptor; distance: number }>
  }> => ipcRenderer.invoke('chroma:searchFunctions', text, nResults, distanceThreshold),

  // Generate a new FunctionDescriptor
  generateCandidate: (userQuery: string): Promise<{ generated: boolean; descriptor: FunctionDescriptor }> =>
    ipcRenderer.invoke('chroma:generateCandidate', userQuery),
})
