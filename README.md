# Speaking Practice web app

A full-stack web app for practicing spontaneous speech. The user gets a generated topic, records themselves talking about it, and receives a transcript, filler-word count, words-per-minute, and structured AI feedback. Supports English and Amharic.

  <img width="408" height="560" alt="image" src="https://github.com/user-attachments/assets/c15e2b71-98dc-421b-bff8-7c0d23db96ee" />  <img width="336" height="555" alt="image" src="https://github.com/user-attachments/assets/151f3aa5-70c7-45f6-a571-4c8fe31051a9" />



---

## Architecture

```
React SPA (Vercel)
      |
      |  HTTPS + Supabase JWT (Authorization: Bearer)
      v
Express API (Docker container on Render)
      |
      |-- ffmpeg / ffprobe        audio conversion + duration
      |-- whisper.cpp (local)     English transcription
      |-- Google Gemini           Amharic transcription, English feedback, English topics
      |-- AddisAI                 Amharic feedback + Amharic topics
      v
Supabase
      |-- Auth                    JWT issuance/verification
      |-- Postgres (RLS)          session records
      |-- Storage                 recorded audio, one folder per user
```

Monorepo layout:

```
frontend/   React + Vite + Tailwind
backend/    Express API, Dockerfile, middleware
```

---

## Request flow: `POST /session/:lang`

1. `requireAuth` verifies the Supabase JWT and attaches `req.user` and `req.accessToken`
2. `sessionLimiter` applies a per-user rate limit (keyed by `req.user.id`)
3. `multer` writes the uploaded `webm` blob to disk
4. `ffmpeg` converts it to 16 kHz mono WAV (the format Whisper expects)
5. Transcription:
   - `en`: whisper.cpp (`base.en`) through `nodejs-whisper`, or Gemini when `TRANSCRIPTION_MODE=api`
   - `am`: Gemini audio input (inline base64 / Files API)
6. `getAudioDuration` reads the real duration with `ffprobe` (does not depend on transcript timestamps)
7. `analyzeSpeech` computes WPM and filler counts using word-boundary regex over a per-language filler list
8. The WAV is uploaded to Supabase Storage under `<user_id>/<timestamp>_<name>`
9. An LLM returns structured feedback as JSON: `{ feedback: string[], naturalWay: string }`
10. The row is inserted using a per-request Supabase client authenticated as the user, so Row Level Security enforces ownership
11. Temp files are removed in a `finally` block

---

## API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | none | Health check |
| GET | `/sessions/:lang` | JWT | List the user's sessions for a language, newest first |
| POST | `/api/:lang/topics` | JWT + rate limit | Generate a batch of 20 topics. Body: `{ exclude: string[] }` |
| POST | `/session/:lang` | JWT + rate limit | Multipart upload (`audio`, `topicPrompt`). Returns transcript, stats, and AI feedback |

`:lang` is `en` or `am`.

Rate limits (per user, per hour): 8 recordings, 20 topic requests. Exceeding a limit returns `429` with a JSON error. The limiter uses `express-rate-limit` with a custom `keyGenerator` and a `skip` list for exempt accounts.

---

## Database

Table `sessions`:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | primary key |
| user_id | uuid | references `auth.users(id)`, on delete cascade |
| topic_prompt | text | |
| audio_url | text | public URL from Supabase Storage |
| transcript | text | |
| duration_seconds | numeric | from ffprobe |
| filler_count | integer | |
| avg_wpm | numeric | |
| filler_breakdown | jsonb | e.g. `{ "um": 3, "like": 2 }` |
| ai_advice | text | JSON string: `{ feedback, naturalWay }` |
| language | text | `en` or `am` |
| created_at | timestamptz | |

Security:
- RLS is enabled. Policies allow `select`, `insert`, and `delete` only where `auth.uid() = user_id`
- Storage policies restrict reads and writes to the folder matching `auth.uid()`
- The backend never uses a service-role key for user data. It builds a client from the caller's JWT, so the database makes the final access decision

---

## Docker

Base image: `node:22-slim`. System packages: `ffmpeg`, `build-essential`, `cmake`, `curl`, `ca-certificates`.

Notable decisions:

- **Model and binary are built at image build time.** `nodejs-whisper` compiles whisper.cpp lazily on first use, which would happen on a user's first request. A warm-up step in the Dockerfile transcribes a generated silent WAV during `docker build`, so the compile and the `base.en` download are baked into the image. This matters on a free host with no persistent disk and cold starts.
- **Portable CPU build.** `NODEJS_WHISPER_CMAKE_ARGS="-DGGML_NATIVE=OFF"` stops whisper.cpp from compiling for the build machine's exact CPU. Without it, the container crashed with `Illegal instruction (core dumped)` (exit 132) because the runtime host lacked instructions available on the build host. The tradeoff is slower inference.
- **`ca-certificates` and `curl`** are required because the slim image ships neither, and the model download shells out to `curl`.

---

## Frontend notes

- Recording uses the `MediaRecorder` API. The blob is sent as `FormData` with the duration and topic
- Topic batches are cached in `localStorage` per language (`practice_topics_<lang>`), refilled in the background when 3 or fewer remain, and the current queue is sent as an `exclude` list to reduce duplicates. Switching language swaps the cached queue immediately
- AI feedback is parsed from JSON and rendered as separate sections (issues and a "natural way to say it" rewrite), with a plain-text fallback if parsing fails
- Transcript highlighting splits text on a filler-word regex with a capture group, so matched fillers stay in the output and can be wrapped in `<mark>`
- `react-i18next` handles the English and Amharic UI
- `vercel.json` rewrites all paths to `index.html` so client-side routes survive a refresh

---

## Environment variables

Backend:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
GEMINI_API_KEY=
ADDIS_API_KEY=
TRANSCRIPTION_MODE=local   # "local" (whisper.cpp) or "api" (Gemini)
```

Frontend:

```
VITE_API_URL=http://localhost:3000
```

---

## Running locally

```bash
git clone https://github.com/Yabowerk/Speaking-Practice-web-app.git
cd Speaking-Practice-web-app
```

Backend:

```bash
cd backend
docker build -t speaking-practice-backend .
docker run -p 3000:3000 --env-file .env speaking-practice-backend
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

If Docker builds are slow on WSL2, try `docker build --network=host`.

---

## Tradeoffs and known limitations

- Local Whisper on a shared CPU is slow, and the portable build makes it slower. Setting `TRANSCRIPTION_MODE=api` swaps in Gemini for faster English transcription with the same image
- Free-tier hosting means cold starts after inactivity
- WPM is computed from transcript word count over audio duration, so it includes pauses
- Filler detection is regex-based and cannot tell a filler "like" from a real one. The Amharic filler list is basic
- LLM output is not guaranteed to be valid JSON, so the backend parses defensively and falls back to plain text
- The ffmpeg conversion and transcription run inside the request, which can approach host request timeouts on long recordings

---

## What I'd add next

- Pace over time, using per-segment timestamps
- Volume and pitch analysis
- A job queue so long transcriptions do not block the request
- A better-researched Amharic filler list
