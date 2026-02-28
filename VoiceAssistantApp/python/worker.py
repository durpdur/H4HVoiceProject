import sys, json, traceback
from faster_whisper import WhisperModel

def send(obj):
  sys.stdout.write(json.dumps(obj) + "\n")
  sys.stdout.flush()

def main():
  # Load once
  model_size = "base"
  language_setting = "en"
  
  model = WhisperModel(model_size, device="cpu", compute_type="int8")

  # Read JSON lines: {"id": "...", "path": "..."}
  for line in sys.stdin:
    line = line.strip()
    if not line:
      continue
    try:
      req = json.loads(line)
      req_id = req["id"]
      audio_path = req["path"]

      segments, info = model.transcribe(
          audio_path, 
          vad_filter=True,
          language=language_setting
          )
      text = "".join(seg.text for seg in segments).strip()

      send({"id": req_id, "ok": True, "text": text})
    except Exception as e:
      send({
        "id": req.get("id", "unknown"),
        "ok": False,
        "error": str(e),
        "trace": traceback.format_exc()
      })

if __name__ == "__main__":
  main()