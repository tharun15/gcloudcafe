# Project Guidelines & Rules for GCloud Cafe

## Branching & Pull Request (PR) Strategy

- **Feature Development**: DO NOT push directly to `main` when implementing new features or major enhancements. Always create a dedicated feature branch (e.g., `feature/<feature-name>`) and open a Pull Request (PR) for review.
- **Application Level Code Changes**: For any code/application changes (e.g. `.js`, `.html`, `.scss`, `.css`, or theme templates — anything beyond basic `.md` or `.txt` content edits), ALWAYS pull latest `main`, create a dedicated feature/fix branch, work on that branch, and create a PR. DO NOT push application code directly to `main`.
- **Direct Pushes to Main**: Direct pushes to `main` are ONLY permitted for urgent, critical infrastructure/CI patches (such as unsticking GitHub Actions workflow runs).
