# cto.new Monorepo Starter

This repository is configured as a pnpm-based monorepo that provides shared tooling for future packages and applications. The root workspace collects common configuration for TypeScript, ESLint, Prettier, and Husky pre-commit hooks so new workspaces can share a single source of truth.

## Requirements

- [Node.js](https://nodejs.org/) v20 (see [`.nvmrc`](./.nvmrc))
- [pnpm](https://pnpm.io/) v8 or newer

## Getting started

```bash
pnpm install
```

The `prepare` script automatically installs Husky, wiring the shared pre-commit hook. After installation you can run common tasks from the repository root:

```bash
pnpm lint           # Runs ESLint across the workspace
pnpm format         # Checks formatting with Prettier
pnpm format:write   # Applies Prettier formatting
pnpm typecheck      # Runs TypeScript in no-emit mode against the shared config
```

## Workspace layout

- [`packages/`](./packages) — Place applications and libraries here. Each package should extend the shared [`tsconfig.base.json`](./tsconfig.base.json).
- Shared configuration files live in the repository root so all packages benefit from the same standards.

## License

This project is licensed under the [MIT License](./LICENSE).
