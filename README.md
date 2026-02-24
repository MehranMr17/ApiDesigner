# API Designer Pro (Static GitHub Pages Ready)

Production-grade visual API designer built as a **fully static frontend**:
- React + TypeScript + Vite
- Zustand + persist middleware (localStorage)
- React Flow diagram engine
- TailwindCSS dark-first UI
- Framer Motion lightweight animations
- HashRouter for GitHub Pages compatibility

## Static-Only Architecture
- No backend server
- No database
- No Firebase / auth / env vars
- Works as static files on GitHub Pages

## Key Features
- Persistent diagram state auto-saved on every change (localStorage)
- Full restoration on refresh
- Minimal default project: one `POST /example` endpoint + one `200` output
- Node CRUD for Inputs / Outputs / Errors
- Structured JSON field modeling (`name`, `type`, `required`)
- Default error schema:
  - `errorCode: string`
  - `message: string`
  - `metadata?: object`
- Status suggestion toggles: `200, 201, 400, 401, 403, 404, 409, 500`
- Keyboard shortcuts: `N`, `I`, `O`, `E`, `Delete`, `Ctrl+S`
- Auto-layout + snap-to-grid + zoom/pan + minimap
- Export options:
  - Project JSON backup
  - Import Project JSON restore
  - OpenAPI JSON export
  - SVG diagram export

## Run
```bash
npm install
npm run dev
```

## Build for GitHub Pages
```bash
npm run build
```
Output is static in `dist/` and works under subpaths via Vite `base: './'` + `HashRouter`.
