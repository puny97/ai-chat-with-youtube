# Frame — Chat with YouTube videos

Frame is a full-stack AI video companion that lets people ask questions and get answers grounded in video transcripts. It combines a polished React chat experience with a TypeScript API and a retrieval-augmented generation (RAG) pipeline.

> **Project status:** A portfolio-ready prototype with production-oriented foundations. External services must be configured, and the production-hardening items below should be addressed before using it with real users.

## Why this project

Long videos make it difficult to find a specific idea or get a useful summary quickly. Frame explores a more direct experience: ask a question in natural language and retrieve relevant transcript context before generating an answer.

The project demonstrates end-to-end product and engineering work across:

- A responsive, accessible chat interface with suggested prompts, keyboard submission, request status, and clear error feedback.
- A typed frontend-to-backend API contract with server-side input validation.
- Transcript chunking and semantic retrieval using OpenAI embeddings and PostgreSQL with `pgvector`.
- A LangChain agent that can retrieve transcript passages and trigger a YouTube transcript-scraping workflow.
- A GitHub Actions workflow that checks formatting and builds both applications.

## How it works

1. A user submits a question from the React client.
2. The frontend sends the question to `POST /api/generate`.
3. The Express backend validates the question and invokes a LangChain agent.
4. The agent retrieves relevant transcript chunks from PostgreSQL/`pgvector` and uses an OpenAI chat model to produce an answer.
5. The frontend displays the response or an actionable error.

Transcript ingestion is handled separately through the `/webhook` endpoint. The Bright Data integration can request a YouTube scrape, and incoming transcript data is split into overlapping chunks and stored with its video ID as metadata.

## Tech stack

| Area                 | Technologies                                           |
| -------------------- | ------------------------------------------------------ |
| Frontend             | React 19, TypeScript, Vite                             |
| Backend              | Node.js, Express 5, TypeScript                         |
| AI and retrieval     | LangChain, LangGraph, OpenAI chat and embedding models |
| Data                 | PostgreSQL, `pgvector`                                 |
| Transcript ingestion | Bright Data dataset API and webhook                    |
| Tooling              | pnpm, ESLint, Prettier, GitHub Actions                 |

## Repository layout

```text
.
├── frontend/                 # React application and Vite configuration
│   └── src/
│       ├── App.tsx           # Chat experience
│       └── api.ts            # Backend request and response validation
├── backend/
│   ├── index.ts              # Express app, API routes, and webhook
│   ├── agent.ts              # LangChain agent and retrieval tools
│   ├── embeddings.ts         # Transcript chunking and pgvector storage
│   ├── brightData.ts         # YouTube scrape integration
│   └── data.ts               # Sample transcript data
└── .github/workflows/ci.yml  # Formatting and build checks
```

## Run locally

### Prerequisites

- Node.js 24 (the CI workflow uses Node 24)
- pnpm 10.30.1
- A PostgreSQL database with the `pgvector` extension available
- An OpenAI API key with access to the configured chat and embedding models
- Bright Data credentials if you want to use transcript scraping

Install pnpm with Corepack if it is not already available:

```powershell
corepack enable
corepack prepare pnpm@10.30.1 --activate
```

Install dependencies from the repository root and in each application. This repository maintains separate lockfiles for the root, frontend, and backend:

```powershell
pnpm install --frozen-lockfile
Set-Location frontend
pnpm install --frozen-lockfile
Set-Location ..\backend
pnpm install --frozen-lockfile
Set-Location ..
```

### Configure the backend

Create `backend/.env` (it is ignored by Git) and provide the values for your local services:

```dotenv
PORT=8000
OPENAI_API_KEY=your-openai-api-key
DB_URL=postgresql://username:password@localhost:5432/frame
API_URL=https://your-public-backend-url
```

`API_URL` is used as the base URL for the Bright Data webhook callback. It must be publicly reachable when testing scrape callbacks; a localhost URL alone cannot receive a callback from Bright Data. The scrape integration requires a valid Bright Data API credential, but the current integration does not provide an environment-variable setting for it. Move that credential into environment-managed secrets before using the scrape workflow or deploying; never add credentials to this file or commit them.

Ensure your database has `pgvector` installed and enabled. For a database where the extension is available, enable it before starting the API:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

The vector store uses a table named `transcripts`; the database role must be allowed to create and use the required table and vector index.

### Start the backend and frontend

Open two PowerShell terminals at the repository root.

Terminal 1 — backend:

```powershell
Set-Location backend
pnpm start:dev
```

Terminal 2 — frontend:

```powershell
Set-Location frontend
pnpm dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`). Vite proxies `/api` requests to `http://localhost:8000`, so the frontend and backend can run locally without changing the client API URL.

## Useful commands

Run these commands from the indicated directory:

| Directory       | Command             | Purpose                                              |
| --------------- | ------------------- | ---------------------------------------------------- |
| `frontend/`     | `pnpm dev`          | Start the Vite development server                    |
| `frontend/`     | `pnpm build`        | Type-check and create the production frontend bundle |
| `frontend/`     | `pnpm lint`         | Run ESLint                                           |
| `frontend/`     | `pnpm preview`      | Preview the built frontend locally                   |
| `backend/`      | `pnpm start:dev`    | Run the API with `tsx` watch mode                    |
| `backend/`      | `pnpm build`        | Compile the backend TypeScript                       |
| `backend/`      | `pnpm start`        | Start the compiled backend from `backend/dist/`      |
| Repository root | `pnpm format:check` | Check formatting in frontend and backend source      |

The CI workflow runs the formatting check and builds the frontend and backend. The backend's current `test` script is a placeholder; there is not yet an automated test suite.

## API overview

### `POST /api/generate`

Request:

```json
{
  "query": "What are the key takeaways?",
  "thread_id": "conversation-id"
}
```

Successful response:

```json
{
  "answer": "The answer grounded in retrieved transcript content."
}
```

The API rejects blank or over-limit questions and invalid thread IDs, and returns JSON error messages for failed requests.

### `POST /webhook`

Accepts transcript/video records from the configured scrape workflow and adds transcript chunks to the vector store. Configure a publicly reachable backend URL as the Bright Data callback target to exercise this route.

## Production considerations

This repository is a strong starting point for a production application, but the current configuration is not a production deployment recipe. Before exposing it to users:

- Load all provider credentials from environment-managed secrets; the Bright Data integration in particular needs to be updated to read its credential from secret configuration rather than source code.
- Restrict CORS to the intended frontend origin and add rate limiting and appropriate request-size limits.
- Add authentication/authorization if the service or saved conversations are user-specific.
- Give each conversation a distinct thread ID and define durable conversation persistence; the current frontend uses a fixed thread ID and the agent uses in-memory checkpointing.
- Connect the chat to an explicit selected video. The current UI does not provide a video URL/ID, while retrieval is scoped by video ID.
- Add API, retrieval, ingestion, and frontend tests, plus health checks and operational logging/monitoring.
- Review database migrations, index strategy, retention, privacy, and provider cost limits for the expected workload.
- Update `frontend/vercel.json` before deployment: its API rewrite currently points at a specific hosted backend URL.

## Notes

- OpenAI, PostgreSQL/`pgvector`, and Bright Data are external dependencies; local builds do not replace their credentials or service configuration.
- AI-generated answers can be incomplete or incorrect. The UI communicates that answers are generated from transcripts and may not be perfect.
- The repository includes sample video/transcript records in `backend/data.ts`; this data should be reviewed and ingested into the vector store as part of a deliberate setup or deployment process.
