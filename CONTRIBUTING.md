# Contributing to Sketchcast

Thanks for helping improve Sketchcast.

## Before you start

1. Search existing issues and pull requests.
2. Open an issue before a large product, storage, or security change.
3. Never commit API keys, `.env.local`, recordings, or private customer data.

## Local workflow

```bash
npm ci
npm run dev
```

Before opening a pull request:

```bash
npm run check
npm run audit:release
```

## Pull requests

- Keep changes focused and explain the user-visible result.
- Add or update tests for behavior changes.
- Include browser verification notes for recording, Excalidraw, key storage,
  cloud sync, or export changes.
- Preserve local-first and BYOK defaults.
- Update documentation when environment variables or trust boundaries change.

Security vulnerabilities should be reported privately through
[SECURITY.md](SECURITY.md), not through a public issue.
