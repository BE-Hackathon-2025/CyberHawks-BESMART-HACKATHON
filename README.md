# Project Title: UniTown

A small React + Vite web app with integrated AI-assisted features.

## Overview

This project is a React application scaffolded with Vite. It includes UI components, CSS styles, and a small backend directory with Python utilities and a Flask app used for server-side features.

Key files and directories:

- `src/` — React source files and components (e.g. `App.jsx`, `Dashboard.jsx`, components folder).
- `public/` — Static assets served by Vite.
- `server/` — Python-based server utilities (`app.py`, `textFormatter.py`, and `serviceAccountKey.json`).
- `package.json` and `vite.config.js` — Project build and dev configuration.

## AI Assistance and Attribution

To maintain transparency in our development process:

We used AI tools — primarily ChatGPT, Claude, and GitHub Copilot — to assist in our project development.
AI was utilized to generate:

- The initial React + Vite app template,

- CSS styling patterns and layout structure, and

- Starter code for integrated AI features within our application.

All AI-generated content underwent significant human modification, including restructuring, logic editing, debugging, and feature integration to align with our specific project goals.
AI also provided conceptual guidance for unfamiliar implementation areas, serving as a learning and problem-solving tool rather than an automatic code source.

Estimated contribution:

Human-written & customized code: ~65%

AI-assisted code: ~35% (a generous estimate, including modified templates and guided integrations)

All AI outputs were reviewed, validated, and adapted by our team, as best as possible in our allocate time, to ensure originality, reliability, and ethical compliance. (See <attachments> above for file contents. You may not need to search or read the file again.)

## Setup (Windows / PowerShell)

1. Install dependencies:

```powershell
npm install
```

2. Start the dev server:

```powershell
npm run dev
```

3. Build for production:

```powershell
npm run build
```

## Notes

- The `server/` folder contains a small Python service. Review `server/requirements.txt` (if present) or `server/app.py` for Python dependencies before running server-side code.
- Keep any secret keys (e.g., `serviceAccountKey.json`) secure and out of public repositories.

## License

Add your preferred license here.

---

If you'd like, I can update this README with more detailed developer setup instructions (Python server run steps, environment variables, or CI scripts), add a short contributing guide, or add a LICENSE file. Which would you like next?

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
