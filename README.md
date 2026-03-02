# VoiceAgentH4H

## To Run

### Host database

chroma run --host 127.0.0.1 --port 8000 --path ./chroma-data

### Run electron

npm run dev

---

## To End

### End database

lsof -i :8000
kill <PID>
