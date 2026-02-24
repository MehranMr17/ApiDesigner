# API Designer Pro (React + TypeScript)

Production-grade visual API designer built with:
- React + TypeScript
- Zustand global store
- React Flow graph rendering
- TailwindCSS (dark-first)
- Framer Motion animations

## Features
- Stable SPA architecture (no full page reloads)
- Endpoint/Input/Output/Error nodes with right-side property inspector
- Structured JSON schema fields (name, type, required)
- Default error schema (`errorCode`, `message`, `metadata?`)
- HTTP status suggestions toggle (200, 201, 400, 401, 403, 404, 409, 500)
- Arrow-based flows with labels
- Shortcuts: `N`, `I`, `O`, `E`, `Delete`, `Ctrl+S`
- Auto layout + snap-to-grid
- Zoom, pan, minimap, controls
- Local persistence via `localStorage`
- Export OpenAPI JSON and SVG diagram

## Run
```bash
npm install
npm run dev
```
