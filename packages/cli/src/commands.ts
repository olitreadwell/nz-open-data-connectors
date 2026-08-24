import { parseArgs } from "node:util";

import {
  NZ_DATA_SOURCES,
  getNzDataSource,
  probeNzDataSource,
} from "@nzlab/nz-sources";
import {
  createStatsNzClient,
  serializeStatsNzRowsToCsv,
} from "@nzlab/stats-nz";
import type { StatsNzClient } from "@nzlab/stats-nz";

export interface CliOutput {
  writeOut(line: string): void;
  writeErr(line: string): void;
}

export interface CliDependencies {
  probeSource?: typeof probeNzDataSource;
  statsNzClient?: StatsNzClient;
}

export const HELP_TEXT = `nzdata - NZ open data connectors

Usage:
  nzdata sources                          List every data source adapter
  nzdata probe <id>                       Live probe one source (e.g. linz)
  nzdata catalogue                        List every Stats NZ dataflow
  nzdata data --dataflow <id> [--format json|csv]
                                          Pull data rows for a dataflow
  nzdata codelist --codelist <id>         Resolve dimension codes to labels
  nzdata help                             Show this help

Options:
  -d, --dataflow <id>   Stats NZ dataflow id (e.g. AGR_AGR_003)
  -f, --format <fmt>    Output format: json (default) or csv
  -c, --codelist <id>   Stats NZ codelist id (e.g. CL_LIVESTOCK_AGR_AGR_003)
  -h, --help            Show help

Keys are read from the environment (STATS_NZ_SUBSCRIPTION_KEY, LINZ_API_KEY,
DIGITAL_NZ_API_KEY). Output goes to stdout as JSON (or CSV); errors go to stderr.`;

function createCliStatsNzClient(): StatsNzClient {
  const options: { subscriptionKey?: string } = {};
  if (process.env.STATS_NZ_SUBSCRIPTION_KEY !== undefined) {
    options.subscriptionKey = process.env.STATS_NZ_SUBSCRIPTION_KEY;
  }
  return createStatsNzClient(options);
}

function getApiKeyForSource(id: string): string | undefined {
  if (id === "linz") {
    return process.env.LINZ_API_KEY;
  }
  if (id === "digitalnz") {
    return process.env.DIGITAL_NZ_API_KEY;
  }
  return undefined;
}

/** Runs one CLI invocation and returns the process exit code. */
export async function runCli(
  args: string[],
  output: CliOutput,
  deps: CliDependencies = {},
): Promise<number> {
  try {
    const { values, positionals } = parseArgs({
      args,
      options: {
        dataflow: { type: "string", short: "d" },
        format: { type: "string", short: "f" },
        codelist: { type: "string", short: "c" },
        help: { type: "boolean", short: "h" },
      },
      allowPositionals: true,
    });

    if (
      values.help === true ||
      positionals[0] === undefined ||
      positionals[0] === "help"
    ) {
      output.writeOut(HELP_TEXT);
      return 0;
    }

    const command = positionals[0];
    const probeSource = deps.probeSource ?? probeNzDataSource;
    const client = deps.statsNzClient ?? createCliStatsNzClient();

    if (command === "sources") {
      const sources = NZ_DATA_SOURCES.map((source) => ({
        id: source.id,
        name: source.name,
        auth: source.auth,
        description: source.description,
      }));
      output.writeOut(JSON.stringify(sources, null, 2));
      return 0;
    }

    if (command === "probe") {
      const id = positionals[1];
      if (id === undefined) {
        output.writeErr("Usage: nzdata probe <id>");
        return 1;
      }
      const adapter = getNzDataSource(id);
      if (adapter === undefined) {
        output.writeErr(`Unknown source: ${id}`);
        return 1;
      }
      const apiKey = getApiKeyForSource(id);
      const probe = await probeSource(
        adapter,
        apiKey === undefined ? {} : { apiKey },
      );
      output.writeOut(JSON.stringify(probe, null, 2));
      return probe.ok ? 0 : 1;
    }

    if (command === "catalogue") {
      const dataflows = await client.getDataflowCatalogue();
      output.writeOut(JSON.stringify(dataflows, null, 2));
      return 0;
    }

    if (command === "data") {
      const dataflowId = values.dataflow;
      if (typeof dataflowId !== "string" || dataflowId.length === 0) {
        output.writeErr(
          "Usage: nzdata data --dataflow <id> [--format json|csv]",
        );
        return 1;
      }
      const format = values.format;
      if (format !== undefined && format !== "json" && format !== "csv") {
        output.writeErr(`Unknown format: ${format} (use json or csv)`);
        return 1;
      }
      const rows = await client.getData({ dataflowId, format: "csv" });
      if (format === "csv") {
        output.writeOut(serializeStatsNzRowsToCsv(rows));
      } else {
        output.writeOut(JSON.stringify(rows, null, 2));
      }
      return 0;
    }

    if (command === "codelist") {
      const codelistId = values.codelist;
      if (typeof codelistId !== "string" || codelistId.length === 0) {
        output.writeErr("Usage: nzdata codelist --codelist <id>");
        return 1;
      }
      const codelist = await client.getCodelist(codelistId);
      output.writeOut(JSON.stringify(codelist, null, 2));
      return 0;
    }

    output.writeErr(`Unknown command: ${command}\n\n${HELP_TEXT}`);
    return 1;
  } catch (error) {
    output.writeErr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
