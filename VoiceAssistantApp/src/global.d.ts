export { };

declare global {
    interface Window {
        stt: {
            transcribeWav(wavBytes: ArrayBuffer): Promise<{ text: string }>;
        };
    }
}