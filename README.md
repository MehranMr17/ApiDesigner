# API Designer Pro

A production-grade, fully static visual API design studio for backend engineers and architects.

## Overview

API Designer Pro helps you model API contracts visually with a node-based diagram experience similar to architecture/ER tools — while staying 100% frontend-only for easy GitHub Pages deployment.

- **Framework**: React + TypeScript + Vite
- **State**: Zustand + persist middleware (localStorage)
- **Diagram Engine**: React Flow
- **Styling**: TailwindCSS (dark-first)
- **Animation**: Framer Motion (lightweight)

## Why this project

This project is designed for teams that want:
- fast API exploration and iteration,
- structured request/response/error schema modeling,
- zero backend operational overhead,
- portable local backups and OpenAPI export.

## Core Capabilities

### Visual Modeling
- Endpoint, Input, Output, and Error node types
- Arrow-based flows with semantic labels
- Right-side inspector for inline editing
- Snap-to-grid, zoom/pan, minimap, and auto-layout

### JSON Schema-Oriented Design
- Field-level schema editing (`name`, `type`, `required`)
- Output/Error schemas represented as structured JSON objects
- Default error schema:
  - `errorCode: string`
  - `message: string`
  - `metadata?: object`

### Productivity
- Keyboard shortcuts:
  - `N` → New endpoint
  - `I` → Add input
  - `O` → Add output
  - `E` → Add error
  - `Delete` → Remove selected node
  - `Ctrl+S` / `Cmd+S` → Save (state is also auto-persisted)
- HTTP status suggestions toggle:
  - `200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`

### Data Portability
- Export Project JSON (backup)
- Import Project JSON (restore)
- Export OpenAPI JSON
- Export Diagram SVG

## Static Deployment Guarantees

This application is intentionally built for static hosting:
- No backend server
- No database
- No Firebase/external storage API
- No authentication
- No environment variables required

It runs correctly on **GitHub Pages subpaths** using:
- `HashRouter`
- Vite `base: './'`

## Default First-Run State

On first load, the app starts minimal and clean:
- `POST /example` endpoint
- one default `200` success response node

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Development

```bash
npm install
npm run dev
```

### Production Build

```bash
npm run build
```

The build output is generated in `dist/` and can be deployed directly to GitHub Pages.

## Project Structure

```text
src/
  components/      # memoized UI blocks (node card, toolbar, inspector)
  lib/             # modeling/export helpers
  store/           # Zustand global store + persistence logic
  types.ts         # shared domain types
  App.tsx          # canvas shell and React Flow orchestration
  main.tsx         # app bootstrap + HashRouter
```

## Notes

- All edits persist locally via browser storage and restore automatically.
- Imported project JSON should match the exported schema format.
- OpenAPI export is intentionally lightweight and focused on designed nodes.
