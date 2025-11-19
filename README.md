# README Generator

AI README builder for GitHub repositories, powered by Next.js App Router with live Markdown preview, streaming output, and multi-provider LLM support (OpenAI, Gemini, OpenRouter).

## Highlights
- Streams polished READMEs from your repo content (multiple styles: light → deep).
- Works with OpenAI GPT‑4o, Gemini 2.5 Flash, or OpenRouter (custom endpoint supported).
- Fetches repo files via GitHub API with optional PAT to avoid rate limits/private repo issues.
- Live preview with preview/raw/split views and one-click copy.
- Settings modal keeps your API keys and endpoints in localStorage (never stored server-side).

## Quickstart
1) Install deps (Node 18+ recommended):
```bash
npm install
```
2) Run dev server:
```bash
npm run dev
```
3) Open http://localhost:3000.
4) Click **Settings**:
   - Choose provider (`OpenAI`, `Gemini`, or `OpenRouter`).
   - Enter API key.
   - Optionally set a custom OpenRouter endpoint.
   - Optionally add a GitHub PAT (needed for private repos or to raise rate limits).
5) Paste a GitHub repo URL (e.g., `https://github.com/vercel/next.js`) and choose a style.
6) (Optional) Add extra project context in “Additional Project Details”.
7) Generate and copy the Markdown.

## Providers
- **OpenAI**: Streams from `gpt-4o` by default.
- **Gemini**: Uses `gemini-2.5-flash` (non-streaming for stability; streamed to UI once parsed).
- **OpenRouter**: Defaults to `anthropic/claude-3.5-sonnet`; accepts a custom endpoint. Sends required `HTTP-Referer`.

## Architecture
- UI: `app/page.js`, `components/GeneratorForm.js`, `components/LivePreview.js`, `components/SettingsModal.js`.
- API: `app/api/generate/route.js` (Edge runtime). Builds prompt and streams LLM output.
- GitHub fetch: `lib/github.js` parses/normalizes repo URLs, uses optional PAT, and fetches a curated set of files.
- LLM client: `lib/llm.js` handles provider-specific payloads and streaming.

## Testing
```bash
npm test -- --runInBand
```
Jest + Testing Library cover the form and settings flows.

## Deployment Notes
- Next.js 16 App Router, Edge runtime for the generate endpoint.
- Add your hosting env settings if you prefer env vars; the UI currently stores keys in localStorage.

## Troubleshooting
- **Rate limited / 403 from GitHub**: Add a GitHub PAT in Settings.
- **Private repo**: Requires PAT with read access.
- **LLM errors**: Ensure the correct provider key/endpoint and enough quota.
