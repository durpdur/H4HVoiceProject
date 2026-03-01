import type { FunctionDescriptor } from "./types/FunctionDescriptor"

declare global {
    interface Window {
        stt: {
            transcribeWav(wavBytes: ArrayBuffer): Promise<{ text: string }>
        }

        chromaAPI: {
            upsertFunction(fd: FunctionDescriptor): Promise<void>
            getFunction(id: string): Promise<FunctionDescriptor | null>
            listFunctions(): Promise<FunctionDescriptor[]>
            deleteFunction(id: string): Promise<void>

            searchFunctions(
                text: string,
                nResults?: number,
                distanceThreshold?: number
            ): Promise<{
                matched: boolean
                results: Array<{ fd: FunctionDescriptor; distance: number }>
            }>

            generateAndStore(
                text: string,
                nResults?: number,
                distanceThreshold?: number
            ): Promise<any>
        }
    }
}

export { }