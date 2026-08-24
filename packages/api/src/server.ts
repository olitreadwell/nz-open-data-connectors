import { serve } from "@hono/node-server";

import { createConnectorsApp } from "./index";
import type { ConnectorsAppOptions } from "./index";

const port = Number(process.env.PORT ?? 8787);

const options: ConnectorsAppOptions = {};
if (process.env.STATS_NZ_SUBSCRIPTION_KEY !== undefined) {
  options.statsNzSubscriptionKey = process.env.STATS_NZ_SUBSCRIPTION_KEY;
}
const apiKeys: Record<string, string> = {};
if (process.env.LINZ_API_KEY !== undefined) {
  apiKeys.linz = process.env.LINZ_API_KEY;
}
if (process.env.DIGITAL_NZ_API_KEY !== undefined) {
  apiKeys.digitalnz = process.env.DIGITAL_NZ_API_KEY;
}
if (Object.keys(apiKeys).length > 0) {
  options.apiKeys = apiKeys;
}

const app = createConnectorsApp(options);

serve({ fetch: app.fetch, port }, (info) => {
  process.stdout.write(
    `NZ open data connectors listening on http://localhost:${info.port}\n`,
  );
});
