import { ipcRenderer, contextBridge } from 'electron'

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
  addCommand: (id: string, description: string, regexPhrases: string[]) =>
    ipcRenderer.invoke('chroma:addCommand', id, description, regexPhrases),

  queryCommands: (text: string, nResults?: number, distanceThreshold?: number) =>
    ipcRenderer.invoke('chroma:queryCommands', text, nResults, distanceThreshold),

  getCommand: (id: string) =>
    ipcRenderer.invoke('chroma:getCommand', id),

  deleteCommand: (id: string) =>
    ipcRenderer.invoke('chroma:deleteCommand', id),

  getAllCommands: () =>
    ipcRenderer.invoke('chroma:getAllCommands'),

  generateAndStore: (text: string, nResults?: number, distanceThreshold?: number) =>
    ipcRenderer.invoke('chroma:generateAndStore', text, nResults, distanceThreshold),
})
