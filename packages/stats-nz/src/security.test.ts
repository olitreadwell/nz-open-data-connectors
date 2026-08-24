import { describe, expect, it } from "vitest";

import { parseDataflowCatalogueXml } from "./catalogue";
import { createStatsNzClient } from "./client";
import { parseStatsNzCsv } from "./csv";
import { StatsNzError } from "./errors";

const CODELIST_XML =
  '<message:Structure><message:Structures><structure:Codelists><structure:Codelist id="CL_X" agencyID="STATSNZ" version="1.0"><structure:Code id="A"><common:Name xml:lang="en">Alpha</common:Name></structure:Code></structure:Codelist></structure:Codelists></message:Structures></message:Structure>';
const CATALOGUE_XML =
  '<message:Structure><message:Structures><structure:Dataflows><structure:Dataflow id="X" agencyID="STATSNZ" version="1.0"><common:Name xml:lang="en">Only table</common:Name></structure:Dataflow></structure:Dataflows></message:Structures></message:Structure>';

function stubFetch(
  handler: (url: string, init: RequestInit) => Promise<Response>,
): typeof fetch {
  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    return handler(url, init ?? {});
  };
}

function routeStub(url: string): Response {
  if (url.includes("/dataflow/")) {
    return new Response(CATALOGUE_XML, {
      headers: { "content-type": "application/xml" },
    });
  }
  if (url.includes("/codelist/")) {
    return new Response(CODELIST_XML, {
      headers: { "content-type": "application/xml" },
    });
  }
  return new Response("DATAFLOW,X_Y,OBS_VALUE\n");
}

describe("stats-nz security", () => {
  it("URL-encodes every user-controlled path segment", async () => {
    const urls: string[] = [];
    const fetchImpl = stubFetch(async (url) => {
      urls.push(url);
      return routeStub(url);
    });
    const client = createStatsNzClient({
      baseUrl: "https://stub.example/rest",
      fetchImpl,
    });
    await client.getData({ dataflowId: "AGR&AGR/003", key: "6731.20#x" });
    await client.getCodelist("CL A/B", { version: "1.0" });
    const joined = urls.join(" ");
    expect(joined).not.toContain("AGR&AGR/003");
    expect(joined).not.toContain("6731.20#x");
    expect(joined).toContain("AGR%26AGR%2F003");
    expect(joined).toContain("CL%20A%2FB");
  });

  it("never includes the subscription key in request URLs", async () => {
    const urls: string[] = [];
    const fetchImpl = stubFetch(async (url) => {
      urls.push(url);
      return routeStub(url);
    });
    const client = createStatsNzClient({
      baseUrl: "https://stub.example/rest",
      fetchImpl,
      subscriptionKey: "super-secret-sub-key",
    });
    await client.getData({ dataflowId: "X" });
    await client.getDataflowCatalogue();
    await client.getCodelist("CL_X");
    expect(urls.join(" ")).not.toContain("super-secret-sub-key");
  });

  it("rejects invalid response formats instead of guessing", async () => {
    const fetchImpl = stubFetch(
      async () => new Response("DATAFLOW,X_Y,OBS_VALUE\n"),
    );
    const client = createStatsNzClient({
      baseUrl: "https://stub.example/rest",
      fetchImpl,
    });
    await expect(
      client.getData({ dataflowId: "X", format: "html" as "csv" }),
    ).rejects.toBeInstanceOf(StatsNzError);
  });

  it("does not expand XML entities in catalogue documents", () => {
    const bomb =
      "<message:Structure>" +
      "<!DOCTYPE lolz [" +
      '<!ENTITY lol "lol">' +
      '<!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">' +
      "]>" +
      '<structure:Dataflows><structure:Dataflow id="X" agencyID="STATSNZ" version="1.0">' +
      '<common:Name xml:lang="en">&lol2;</common:Name>' +
      "</structure:Dataflow></structure:Dataflows></message:Structures></message:Structure>";
    const flows = parseDataflowCatalogueXml(bomb);
    const title = flows[0]?.title ?? "";
    expect(title.length).toBeLessThan(100);
  });

  it("treats formula-like CSV values as plain data, never evaluating them", () => {
    const rows = parseStatsNzCsv(
      "DATAFLOW,X_Y,OBS_VALUE\nSTATSNZ:A(1.0),=SUM(1+1),3\n",
      {
        dataflowId: "Y",
      },
    );
    expect(rows[0]?.dimensions.X).toBe("=SUM(1+1)");
  });

  it("rejects non-finite observation values", () => {
    expect(() =>
      parseStatsNzCsv(
        "DATAFLOW,X_Y,OBS_VALUE\nSTATSNZ:A(1.0),x,not-a-number\n",
        {
          dataflowId: "Y",
        },
      ),
    ).toThrow(StatsNzError);
  });
});
