/** One dataflow (dataset) in the Aotearoa Data Explorer catalogue. */
export interface StatsNzDataflow {
  id: string;
  agencyId: string;
  version: string;
  title: string;
}

/** One observation (a single data point) from a Stats NZ data pull. */
export interface StatsNzObservation {
  dimensions: Record<string, string>;
  labels?: Record<string, string>;
  value: number | null;
  status?: string;
}

/** Wire format for a Stats NZ data pull. */
export type StatsNzDataFormat = 'csv' | 'csvfilewithlabels' | 'jsondata';

/** One code-to-label pair inside a codelist. */
export interface StatsNzCodelistItem {
  id: string;
  name: string;
}

/** A codelist: the codes used in a dataflow and their human labels. */
export interface StatsNzCodelist {
  id: string;
  agencyId: string;
  version: string;
  items: StatsNzCodelistItem[];
}

/** Input for a Stats NZ data pull. */
export interface StatsNzGetDataRequest {
  dataflowId: string;
  key?: string;
  version?: string;
  format?: StatsNzDataFormat;
}

/** Options for creating a Stats NZ client. */
export interface StatsNzClientOptions {
  baseUrl?: string;
  subscriptionKey?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/** The Stats NZ (ADE) API surface: catalogue, data, and codelists. */
export interface StatsNzClient {
  getDataflowCatalogue(): Promise<StatsNzDataflow[]>;
  getData(request: StatsNzGetDataRequest): Promise<StatsNzObservation[]>;
  getCodelist(codelistId: string, options?: { version?: string }): Promise<StatsNzCodelist>;
}
