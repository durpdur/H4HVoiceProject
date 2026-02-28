import { useState, useEffect, useRef } from 'react'
import FunctionInterface from './components/FunctionInterface/FunctionInterface'
import type { FunctionDescriptor } from './types/FunctionDescriptor'
import { Button, Stack } from '@mui/material'
import { encodeWav16kMono, floatTo16BitPCM, resampleTo16k } from "./audio/wavEncode";
import Transcriber from './components/Transcriber/Transcriber'


function App() {
  const [functions, setFunctions] = useState<FunctionDescriptor[]>([])
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [displayText, setDisplayText] = useState("");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const chunksRef = useRef<Float32Array[]>([]);
  const inputSampleRateRef = useRef<number>(48000);

  // -- Audio Helpers ----------------------------
  async function startRecording() {
    if (isRecording) return;
    setDisplayText("");
    chunksRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    streamRef.current = stream;

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    inputSampleRateRef.current = audioCtx.sampleRate;

    // IMPORTANT: make sure Vite serves this worklet file
    // Easiest: import it as URL:
    const workletUrl = new URL("./audio/pcm-worklet.ts", import.meta.url);
    await audioCtx.audioWorklet.addModule(workletUrl);

    const source = audioCtx.createMediaStreamSource(stream);
    sourceRef.current = source;

    const node = new AudioWorkletNode(audioCtx, "pcm-processor");
    workletNodeRef.current = node;

    node.port.onmessage = (e) => {
      const buf = e.data as Float32Array;
      chunksRef.current.push(buf);
    };

    // connect (don’t connect to destination if you don’t want monitoring)
    source.connect(node);

    setIsRecording(true);
  }

  async function stopRecording() {
    if (!isRecording) return;
    setIsRecording(false);

    // stop audio graph
    workletNodeRef.current?.disconnect();
    sourceRef.current?.disconnect();
    await audioCtxRef.current?.close();

    // stop mic
    streamRef.current?.getTracks().forEach((t) => t.stop());

    // concat chunks
    const chunks = chunksRef.current;
    const total = chunks.reduce((sum, c) => sum + c.length, 0);
    const merged = new Float32Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }

    // resample -> int16 -> wav
    const resampled = resampleTo16k(merged, inputSampleRateRef.current);
    const pcm16 = floatTo16BitPCM(resampled);
    const wav = encodeWav16kMono(pcm16);

    // call Electron
    const result = await window.stt.transcribeWav(wav);
    setDisplayText(result.text || "");
  }

  // Adds two mockFunctions to function state
  useEffect(() => {
    const mockFunction: FunctionDescriptor = {
      function_id: "kettle_on_001",
      function_desc: "Turns on the smart kettle, optionally for a specified duration in minutes.",
      regex_phrases: [
        "turn on (the )?kettle",
        "start (the )?kettle",
        "boil water"
      ],
      logic:
        "if (slots.duration) { device.kettle.turn_on({ duration: slots.duration }); } else { device.kettle.turn_on(); }",
      response_phrase: "Kettle has been turned on",
      slots: { duration: "(\\d+)\\s+minutes" },
      metadata: { confidence_score: 0.95, usage_count: 12 },
    }
    const mockFunction2: FunctionDescriptor = {
      function_id: "kettle_off_001",
      function_desc: "Turns off the smart kettle immediately or cancels a scheduled heating cycle.",
      regex_phrases: [
        "turn off (the )?kettle",
        "stop (the )?kettle",
        "cancel (the )?kettle"
      ],
      logic: "device.kettle.turn_off();",
      response_phrase: "Kettle has been turned off",
      slots: {},
      metadata: { confidence_score: 0.93, usage_count: 7 },
    }

    setFunctions([mockFunction, mockFunction2])
  }, [])

  // "N" key listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.code === "KeyN") {
        e.preventDefault();
        startRecording();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "KeyN") {
        e.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [isRecording]);


  // FUNCTION
  // Updates the function state
  const updateFunction = (index: number, updated: FunctionDescriptor) => {
    setFunctions(prev => prev.map((f, i) => (i === index ? updated : f)))
  }

  // prints function
  const printFunction = () => {
    functions.map(func => console.log(func.response_phrase));
  }

  return (
    <div style={{ height: "100vh", padding: 16 }}>
      <Stack direction="row" spacing={2} sx={{ height: "100%" }}>
        {/* LEFT — Voice + Button */}
        <Stack
          spacing={2}
          sx={{
            width: 300,
            flexShrink: 0,
            alignItems: "center",
          }}
        >
          <Transcriber
            isRecording={isRecording}
            onToggle={() => setIsRecording((prev) => !prev)}
            displayText={displayText}
          />
          <Button fullWidth onClick={printFunction}>
            Check State
          </Button>
        </Stack>

        {/* RIGHT — Functions (Scrollable) */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: 8,
          }}
        >
          {functions.map((func, idx) => (
            <FunctionInterface
              key={func.function_id}
              functionData={func}
              onChange={(updated) => updateFunction(idx, updated)}
            />
          ))}
        </div>
      </Stack>
    </div>
  )
}

export default App