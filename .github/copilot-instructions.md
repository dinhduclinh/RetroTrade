# Copilot Instructions for RetroTrade

This document guides AI coding agents to be productive in the RetroTrade codebase. It covers architecture, workflows, conventions, and integration points specific to this project.

## Architecture Overview
- **Monorepo structure**: Contains `frontend` (Next.js/TypeScript) and `backend` (Node.js/Express) folders.
- **Frontend**: Built with Next.js, using TypeScript. Key directories:
  - `src/components/`: Reusable UI components (e.g., `header.tsx`, `footer.tsx`).
  - `src/pages/`: Page-level components (e.g., `index.tsx`).
  - `src/styles/`: Global CSS styles.
  - `public/`: Static assets (SVGs, images).
- **Backend**: Node.js with Express. Key directories:
  - `src/models/`: Data models (e.g., `users.js`).
  - `src/controller/`: Route handlers and business logic.
  - `src/routes/`: API route definitions.
  - `src/config/db.js`: Database connection setup.

## Developer Workflows
- **Frontend development**:
  - Start dev server: `npm run dev` (in `frontend/`).
  - Edit pages in `src/pages/`, components in `src/components/`.
  - Hot reload is enabled by default.
- **Backend development**:
  - Start server: `node server.js` (in `backend/`).
  - API endpoints are defined in `src/routes/` and handled in `src/controller/`.
- **No custom build/test scripts detected**; use standard Next.js and Node.js commands.

## Conventions & Patterns
- **Frontend**:
  - Uses TypeScript for type safety.
  - Follows Next.js file-based routing in `src/pages/`.
  - Global styles in `src/styles/globals.css`.
- **Backend**:
  - Express routes are modularized in `src/routes/` and controllers.
  - Models are defined in `src/models/`.
  - Database config in `src/config/db.js`.
- **No custom linting or formatting rules detected.**

## Integration Points
- **Frontend-backend communication**:
  - Typically via REST API endpoints defined in `backend/src/routes/`.
  - No direct integration code found; agents should check for fetch/axios usage in frontend for API calls.
- **External dependencies**:
  - Frontend: Next.js, TypeScript, PostCSS.
  - Backend: Express, database (see `db.js`).

## Examples
- To add a new API route: create a file in `backend/src/routes/`, implement logic in `backend/src/controller/`, and update `server.js` if needed.
- To add a new page: create a `.tsx` file in `frontend/src/pages/`.

## Key Files
- `frontend/src/pages/index.tsx`: Main landing page.
- `backend/server.js`: Express server entry point.
- `backend/src/config/db.js`: Database connection.

---
For questions or missing details, review the README files or ask for clarification.
