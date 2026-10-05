# @nz-open-data-connectors/connectors-cli

The `nzdata` command line tool for the NZ open data connectors. It prints JSON or CSV to stdout.

## What this package does

- Prints source lists, live probes, Stats NZ tables, and DigitalNZ media.
- Writes JSON or CSV to stdout. Errors go to stderr.
- Reads keys from the environment only. It never accepts a key from a caller.
- Calls the same `nz-sources` and `stats-nz` code as the HTTP API.

## Install

```sh
npm install -g @nz-open-data-connectors/connectors-cli
```

## Quick start

```sh
npx @nz-open-data-connectors/connectors-cli sources
npx @nz-open-data-connectors/connectors-cli probe geonet
npx @nz-open-data-connectors/connectors-cli data --dataflow AGR_AGR_003 --format csv
```

After a global install, the command is `nzdata`.

## Commands

| Command | What it does |
| --- | --- |
| `nzdata sources` | List every data source adapter. |
| `nzdata probe <id>` | Live probe one source. For example, `linz`. |
| `nzdata media --query <q> [--type <type>]` | Search DigitalNZ media. |
| `nzdata catalogue` | List every Stats NZ dataflow. |
| `nzdata data --dataflow <id> [--format json\|csv]` | Pull data rows for a dataflow. |
| `nzdata codelist --codelist <id>` | Resolve dimension codes to labels. Needs a key. |
| `nzdata help` | Show help. |

## Notes and limits

- Output goes to stdout as JSON or CSV. Errors go to stderr. The exit code is 0 on success.
- Keys are read from the environment: `STATS_NZ_SUBSCRIPTION_KEY`, `LINZ_API_KEY`, and `DIGITAL_NZ_API_KEY`.
- Media types are `images` (the default), `newspapers`, `videos`, `audio`, `literature`, and `artwork`.
- `nzdata codelist` needs `STATS_NZ_SUBSCRIPTION_KEY`.
- Every source works keyless. The keys unlock more data or a higher rate limit.

## Data sources and licences

- This CLI reads the same sources as `@nz-open-data-connectors/nz-sources` and `@nz-open-data-connectors/stats-nz`.
- The publishers are GeoNet, data.govt.nz, Stats NZ, DigitalNZ, Trade Me, NZOR, LINZ, ArcGIS Hub portals, LAWA, MfE, Landcare Research LRIS, and Waka Kotahi (NZTA).
- The source URLs are in the `nz-sources` README.
- The data is not covered by the package licence. Each publisher sets the licence for its own data. Check the source page before you reuse a dataset.

## Package licence

MIT. See LICENSE.

## Links

- npm: https://www.npmjs.com/package/@nz-open-data-connectors/connectors-cli
- source: https://github.com/olitreadwell/nz-open-data-connectors/tree/main/packages/cli
- docs: https://github.com/olitreadwell/nz-open-data-connectors#readme
