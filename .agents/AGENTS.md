# Project Guidelines & Rules for GCloud Cafe

## Branching & Pull Request (PR) Strategy

- **Feature Development**: DO NOT push directly to `main` when implementing new features or major enhancements. Always create a dedicated feature branch (e.g., `feature/<feature-name>`) and open a Pull Request (PR) for review.
- **Application Level Code Changes**: For any code/application changes (e.g. `.js`, `.html`, `.scss`, `.css`, or theme templates — anything beyond basic `.md` or `.txt` content edits), ALWAYS pull latest `main`, create a dedicated feature/fix branch, work on that branch, and create a PR. DO NOT push application code directly to `main`.
- **Direct Pushes to Main**: Direct pushes to `main` are ONLY permitted for urgent, critical infrastructure/CI patches (such as unsticking GitHub Actions workflow runs).

## UI/UX & Layout Design Standards

- **Navigation Header Spacing**: To maintain a clean, high-performance, and content-first technical reading layout (Vercel/Linear style), the header should have a compact vertical padding. Prefer using `py-3` on mobile and `py-3.5` (or equivalent tight spacing) on desktop layout screens. Do not use very tall or bulky navigation layouts.

