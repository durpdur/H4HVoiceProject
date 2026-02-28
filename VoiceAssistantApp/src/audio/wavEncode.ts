// Simple linear resampler from inputSampleRate -> 16000
export function resampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
    const targetRate = 16000;
    if (inputSampleRate === targetRate) return input;

    const ratio = inputSampleRate / targetRate;
    const newLength = Math.round(input.length / ratio);
    const output = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
        const t = i * ratio;
        const i0 = Math.floor(t);
        const i1 = Math.min(i0 + 1, input.length - 1);
        const frac = t - i0;
        output[i] = input[i0] * (1 - frac) + input[i1] * frac;
    }
    return output;
}

export function floatTo16BitPCM(float32: Float32Array): Int16Array {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        let s = Math.max(-1, Math.min(1, float32[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
}

export function encodeWav16kMono(pcm16: Int16Array): ArrayBuffer {
    const sampleRate = 16000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = pcm16.length * 2;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    let o = 0;
    const writeStr = (s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o++, s.charCodeAt(i)); };
    const writeU32 = (v: number) => { view.setUint32(o, v, true); o += 4; };
    const writeU16 = (v: number) => { view.setUint16(o, v, true); o += 2; };

    writeStr("RIFF");
    writeU32(36 + dataSize);
    writeStr("WAVE");

    writeStr("fmt ");
    writeU32(16);
    writeU16(1); // PCM
    writeU16(numChannels);
    writeU32(sampleRate);
    writeU32(byteRate);
    writeU16(blockAlign);
    writeU16(bitsPerSample);

    writeStr("data");
    writeU32(dataSize);

    // PCM data
    for (let i = 0; i < pcm16.length; i++) {
        view.setInt16(o, pcm16[i], true);
        o += 2;
    }

    return buffer;
}