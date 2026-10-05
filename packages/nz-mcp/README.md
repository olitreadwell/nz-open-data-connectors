# @nz-open-data-connectors/nz-mcp

An MCP server that exposes the NZ open data connectors to Claude, ChatGPT, and other MCP clients.

## What this package does

- Serves the `nz-sources` and `stats-nz` connectors over the Model Context Protocol (MCP).
- Runs as a stdio server. The binary is `nz-open-data-mcp`.
- Lists sources, probes them live, and fetches data by name.
- Uses keyless sources only. No account is needed.

## Install

```sh
npm install @nz-open-data-connectors/nz-mcp
```

## Quick start

```sh
npx @nz-open-data-connectors/nz-mcp
```

Add the server to a project's `.mcp.json`:

```json
{
  "mcpServers": {
    "nz-open-data": {
      "command": "npx",
      "args": ["-y", "@nz-open-data-connectors/nz-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
| --- | --- |
| `list_sources` | Every source, with the id the other tools take. |
| `probe_sources` | Live fetch against each source, so you know a number is real and not a stale fixture. |
| `fetch_source` | One source through its adapter. |
| `nz_felt_earthquakes` | Recent felt earthquakes from GeoNet, by minimum intensity. |
| `nz_datastore_rows` | Rows from one data.govt.nz CKAN datastore resource. |
| `nz_trademe_categories` | The public Trade Me category tree. |
| `stats_nz_dataflow_catalogue` | Every Stats NZ Aotearoa Data Explorer dataflow. |
| `stats_nz_data` | Observations from one Stats NZ dataflow. |
| `stats_nz_codelist` | The code-to-label map for a Stats NZ dataflow. |

## Notes and limits

- `probe_sources` matters. Every adapter falls back to a committed fixture when the upstream API is slow, so a number can be months old. Probe first when freshness matters.
- Add a tool by wrapping the named function from `@nz-open-data-connectors/nz-sources`, not the adapter's `fetchLive()`. The named functions carry the real query parameters.
- Add one entry to `NZ_QUERY_TOOLS` in `src/nzOpenDataMcpServer.ts`, then rebuild. The tool appears after that.
- The server is stdio only. A remote MCP endpoint needs a tunnel in front of it.

## Data sources and licences

- This server reads the same sources as `@nz-open-data-connectors/nz-sources` and `@nz-open-data-connectors/stats-nz`.
- The publishers are GeoNet, data.govt.nz, Stats NZ, DigitalNZ, Trade Me, NZOR, LINZ, ArcGIS Hub portals, LAWA, MfE, Landcare Research LRIS, and Waka Kotahi (NZTA).
- The source URLs are in the `nz-sources` README.
- The data is not covered by the package licence. Each publisher sets the licence for its own data. Check the source page before you reuse a dataset.

## Package licence

MIT. See LICENSE.

## Links

- npm: https://www.npmjs.com/package/@nz-open-data-connectors/nz-mcp
- source: https://github.com/olitreadwell/nz-open-data-connectors/tree/main/packages/nz-mcp
- docs: https://github.com/olitreadwell/nz-open-data-connectors#readme
