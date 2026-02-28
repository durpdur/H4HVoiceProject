class PcmProcessor extends AudioWorkletProcessor {
    process(inputs: Float32Array[][]) {
        const input = inputs[0];
        if (!input || input.length === 0) return true;

        // Take channel 0
        const ch0 = input[0];
        // Copy to transfer
        const buf = new Float32Array(ch0.length);
        buf.set(ch0);
        // Send to main thread
        this.port.postMessage(buf, [buf.buffer]);
        return true;
    }
}

registerProcessor("pcm-processor", PcmProcessor);