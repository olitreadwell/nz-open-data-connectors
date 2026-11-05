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
| `probe_sources` | Live fetch against each requested source, so you know a number is real and not a stale fixture. |
| `fetch_source` | One source through its adapter. |
| `nz_felt_earthquakes` | Recent felt earthquakes from GeoNet, by minimum intensity. |
| `nz_datastore_rows` | Rows from one data.govt.nz CKAN datastore resource. |
| `nz_trademe_categories` | The public Trade Me category tree. |
| `nz_ade_search` | Search the Aotearoa Data Explorer table index. |
| `nz_data_govt_search` | Search the data.govt.nz catalogue. |
| `nz_digitalnz_records` | Search DigitalNZ records across every collection. |
| `nz_digitalnz_media` | Search DigitalNZ within one media category. |
| `nz_linz_layers` | Search the LINZ Data Service layer catalogue. |
| `nz_nzor_names` | Search the New Zealand Organisms Register. |
| `nz_arcgis_hub_search` | Search datasets on an ArcGIS Hub. |
| `nz_arcgis_hub_collections` | List the collections on an ArcGIS Hub. |
| `nz_lawa_river_quality` | River quality monitoring sites from LAWA. |
| `nz_mfe_layers` | Search the Ministry for the Environment layer catalogue. |
| `nz_lris_layers` | Search the Landcare Research layer catalogue. |
| `nz_nzta_hotspots` | Waka Kotahi holiday journey hotspots. |
| `nz_nzta_open_data` | The Waka Kotahi open data catalogue. |
| `stats_nz_dataflow_catalogue` | Every Stats NZ Aotearoa Data Explorer dataflow. |
| `stats_nz_data` | Observations from one Stats NZ dataflow. |
| `stats_nz_codelist` | The code-to-label map for a Stats NZ dataflow. |

## Notes and limits

- `probe_sources` takes optional `ids` and probes only those sources. A failed live fetch returns an error; fixtures are never a silent fallback.
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
