# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, layout, and styles (`globals.css`).
- `components/`: UI components and their tests.
- `lib/`: API helpers (`github.js`, `llm.js`).
- `public/`: Static assets.
- `.github/workflows/`: CI for GHCR image publishing.
- Docker: `Dockerfile`, `docker-compose.yml`; context trimmed via `.dockerignore`.

## Build, Test, and Development Commands
- Local dev: `npm run dev` (Next.js dev server on port 3000).
- Build: `npm run build` (production bundle).
- Start: `npm run start` (serve the built app).
- Tests: `npm test -- --runInBand` (Jest + Testing Library).
- Lint: `npm run lint` (ESLint per `eslint.config.mjs`).

## Coding Style & Naming Conventions
- Language: JavaScript/React (Next.js 16), Tailwind for styling.
- Indentation: 2 spaces; prefer named exports for components/helpers.
- React components in `components/` use `PascalCase`; hooks/utilities in `lib/` use `camelCase`.
- Keep UI strings in English; avoid inline secrets—read keys from localStorage/front-end settings.

## Testing Guidelines
- Framework: Jest + @testing-library/react/jsdom.
- Location: co-located tests (e.g., `components/Foo.test.js`).
- Naming: `*.test.js`; use descriptive test names for behaviors, not implementation.
- Coverage: collected to `coverage/` by default; keep new code covered with happy-path and validation tests.

## Commit & Pull Request Guidelines
- Commits: keep messages imperative and scoped (e.g., “Add Docker packaging”, “Fix metadata tags”).
- One logical change per commit; include tests when touching behavior.
- PRs: describe the change, note testing performed (`npm test`, manual steps), and mention any config/env impacts (API keys, PATs, GHCR).

## Security & Configuration Tips
- API keys and GitHub PATs stay client-side (localStorage) and should not be committed.
- For higher GitHub API limits or private repos, supply a PAT via the UI.
- GHCR publish: workflow builds on `main` pushes and `v*` tags, tagging `latest`, semver, and SHA.

## Docker Notes
- Build locally: `docker build -t ghcr.io/razdnut/genme:local .`
- Run: `docker run -p 3000:3000 ghcr.io/razdnut/genme:local`
- Compose: `docker compose up -d` (uses `ghcr.io/razdnut/genme:latest` by default).
