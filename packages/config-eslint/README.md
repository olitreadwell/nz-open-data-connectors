# @nz-open-data-connectors/config-eslint

Internal package. It is not published to npm.

Shared ESLint flat config for every TypeScript package in this repo. Repo maintainers use it through the workspace.

## What this package does

- Exports the shared flat config at `./base`.
- Pins ESLint, TypeScript, and the plugins at exact versions.
- Keeps one lint setup for every package in this repo.

## Install

This package is a workspace dependency. Add it to the `devDependencies` of another package in this repo, then run `npm install` at the repo root.

```sh
npm install
```

## Quick start

```js
// eslint.config.mjs
import config from '@nz-open-data-connectors/config-eslint/base';

export default [...config];
```

## Exports

| Export | What it is |
| --- | --- |
| `@nz-open-data-connectors/config-eslint/base` | The shared flat config array. |

## Notes and limits

- ESLint 9.39.5 and TypeScript 6.0.3 are peer dependencies.
- Only the `./base` config exists in this repo.
- Console rules allow `warn` and `error`. They block `log`.

## Data sources and licences

None. This package ships no data.

## Package licence

MIT. See LICENSE.

## Links

- source: https://github.com/olitreadwell/nz-open-data-connectors/tree/main/packages/config-eslint
- docs: https://github.com/olitreadwell/nz-open-data-connectors#readme
