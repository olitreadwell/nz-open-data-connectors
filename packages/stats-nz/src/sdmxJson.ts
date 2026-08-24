import { z } from 'zod';

import { StatsNzParseError } from './errors';
import type { StatsNzObservation } from './types';

const sdmxJsonResponseSchema = z.object({
  data: z.object({
    dataSets: z
      .array(
        z.object({
          series: z.record(
            z.string(),
            z.object({
              observations: z.record(
                z.string(),
                z.array(z.union([z.number(), z.null(), z.array(z.number())])),
              ),
            }),
          ),
        }),
      )
      .default([]),
    structure: z.object({
      dimensions: z.object({
        series: z.array(
          z.object({
            id: z.string(),
            values: z.array(z.object({ id: z.string(), name: z.string() })),
          }),
        ),
        observation: z
          .array(
            z.object({
              id: z.string(),
              values: z.array(z.object({ id: z.string(), name: z.string() })),
            }),
          )
          .default([]),
      }),
      attributes: z
        .object({
          observation: z
            .array(
              z.object({
                id: z.string(),
                values: z.array(z.object({ id: z.string(), name: z.string() })),
              }),
            )
            .default([]),
        })
        .default({}),
    }),
  }),
});

export function parseSdmxJsonResponse(json: string): StatsNzObservation[] {
  let raw: unknown;
  try {
    raw = JSON.parse(json) as unknown;
  } catch {
    throw new StatsNzParseError('Stats NZ jsondata response is not valid JSON');
  }

  const parsed = sdmxJsonResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new StatsNzParseError('Stats NZ jsondata response does not match the SDMX-JSON shape');
  }

  const { dataSets, structure } = parsed.data.data;
  const seriesDimensions = structure.dimensions.series;
  const timeDimension =
    structure.dimensions.observation.find((dimension) => dimension.id === 'TIME_PERIOD') ??
    structure.dimensions.observation[0];
  const statusAttribute = structure.attributes.observation.find(
    (attribute) => attribute.id === 'OBS_STATUS',
  );
  const rows: StatsNzObservation[] = [];

  for (const dataSet of dataSets) {
    for (const [seriesKey, series] of Object.entries(dataSet.series)) {
      const dimensions: Record<string, string> = {};
      const labels: Record<string, string> = {};
      const seriesIndexes = seriesKey.split(':').map((part) => Number(part));

      seriesDimensions.forEach((dimension, index) => {
        const position = seriesIndexes[index];
        const code = position === undefined ? undefined : dimension.values[position];
        if (code !== undefined) {
          dimensions[dimension.id] = code.id;
          labels[dimension.id] = code.name;
        }
      });

      for (const [observationKey, observation] of Object.entries(series.observations)) {
        if (timeDimension !== undefined) {
          const timeIndex = Number(observationKey.split(':')[0]);
          const period = timeDimension.values[timeIndex];
          if (period !== undefined) {
            dimensions.TIME_PERIOD = period.id;
            labels.TIME_PERIOD = period.name;
          }
        }

        const value = typeof observation[0] === 'number' ? observation[0] : null;
        const row: StatsNzObservation = {
          dimensions: { ...dimensions },
          labels: { ...labels },
          value,
        };

        const attributeRefs = observation[1];
        if (Array.isArray(attributeRefs) && statusAttribute !== undefined) {
          const statusIndex = attributeRefs[0];
          const status =
            statusIndex === undefined ? undefined : statusAttribute.values[statusIndex];
          if (status !== undefined && status.id !== '') {
            row.status = status.id;
          }
        }

        rows.push(row);
      }
    }
  }

  return rows;
}
