# @nz-open-data-connectors/nz-mcp

An MCP server over the NZ open data connector library. Point Claude
Code, Claude Desktop, or a ChatGPT connector at it and the model can list the
sources, check which ones are answering, and pull real data.

Every source in this library is keyless. Nothing here needs an account.

## Tools

| Tool                          | What it does                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `list_sources`                | Every source, with the id the other tools take.                                       |
| `probe_sources`               | Live fetch against each source, so you know a number is real and not a stale fixture. |
| `fetch_source`                | One source through its adapter.                                                       |
| `nz_felt_earthquakes`         | Recent felt earthquakes from GeoNet, by minimum intensity.                            |
| `nz_datastore_rows`           | Rows from one data.govt.nz CKAN datastore resource.                                   |
| `nz_trademe_categories`       | The public Trade Me category tree.                                                    |
| `stats_nz_dataflow_catalogue` | Every Stats NZ Aotearoa Data Explorer dataflow.                                       |
| `stats_nz_data`               | Observations from one Stats NZ dataflow.                                              |
| `stats_nz_codelist`           | The code-to-label map for a Stats NZ dataflow.                                        |

`probe_sources` matters more than it looks. Every adapter falls back to a
committed fixture when the upstream API is slow, so a build never fails on a
flaky government host. That also means a number can be months old without
anyone noticing. Probe first when the freshness of the answer matters.

## Running it

```sh
npm install
npm run build
node dist/stdio.js
```

The bin is `nz-open-data-mcp`, so a global install gives you:

```sh
npx @nz-open-data-connectors/nz-mcp
```

## Wiring it into Claude Code

```sh
claude mcp add nz-open-data -- node /absolute/path/to/packages/nz-mcp/dist/stdio.js
```

Or in `.mcp.json` at the root of whatever project you want it in:

```json
{
  "mcpServers": {
    "nz-open-data": {
      "command": "node",
      "args": ["/absolute/path/to/packages/nz-mcp/dist/stdio.js"]
    }
  }
}
```

## Wiring it into Claude Desktop

Add the same block to `claude_desktop_config.json`
(`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS).

## Wiring it into ChatGPT

ChatGPT connectors take a remote MCP endpoint, so this stdio server needs a
tunnel in front of it:

```sh
npx @modelcontextprotocol/inspector node dist/stdio.js   # inspect and test locally
cloudflared tunnel --url http://localhost:PORT            # then point the connector at it
```

## Adding a tool

Wrap the named function from `@$nz-open-data-connectors/nz-sources`, not the
adapter's `fetchLive()`. `fetchLive()` takes no query parameters, so a tool
built on it can only ever return the adapter's default slice. The named
functions carry the real parameters.

Add one entry to `NZ_QUERY_TOOLS` in
`src/nzOpenDataMcpServer.ts`, rebuild, and the tool appears.
