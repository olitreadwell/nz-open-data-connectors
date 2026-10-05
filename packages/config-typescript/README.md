# @nz-open-data-connectors/config-typescript

Internal package. It is not published to npm.

Shared TypeScript configuration for every package in this repo. Repo maintainers extend it from their tsconfig files.

## What this package does

- Provides `base.json` for the shared compiler options.
- Provides `library.json` for the publishable packages, and it extends `base.json`.
- Keeps one TypeScript strictness level for the whole repo.

## Install

This package is a workspace dependency. Add it to the `devDependencies` of another package in this repo, then run `npm install` at the repo root.

```sh
npm install
```

## Quick start

```json
{
  "extends": "@nz-open-data-connectors/config-typescript/library.json"
}
```

## Exports

| Export | What it is |
| --- | --- |
| `@nz-open-data-connectors/config-typescript/base.json` | Shared compiler options. |
| `@nz-open-data-connectors/config-typescript/library.json` | Library build options. Extends `base.json`. |

## Notes and limits

- `library.json` sets `outDir` to `./dist` and `rootDir` to `./src`.
- `library.json` excludes test files, spec files, and stories from the build.
- Every package in this repo extends `library.json`.

## Data sources and licences

None. This package ships no data.

## Package licence

MIT. See LICENSE.

## Links

- source: https://github.com/olitreadwell/nz-open-data-connectors/tree/main/packages/config-typescript
- docs: https://github.com/olitreadwell/nz-open-data-connectors#readme
