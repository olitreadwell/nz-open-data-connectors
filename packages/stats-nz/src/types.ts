export interface StatsNzDataflow {
  id: string;
  agencyId: string;
  version: string;
  title: string;
}

export interface StatsNzObservation {
  dimensions: Record<string, string>;
  labels?: Record<string, string>;
  value: number | null;
  status?: string;
}

export type StatsNzDataFormat = 'csv' | 'csvfilewithlabels' | 'jsondata';

export interface StatsNzCodelistItem {
  id: string;
  name: string;
}

export interface StatsNzCodelist {
  id: string;
  agencyId: string;
  version: string;
  items: StatsNzCodelistItem[];
}

export interface StatsNzGetDataRequest {
  dataflowId: string;
  key?: string;
  version?: string;
  format?: StatsNzDataFormat;
}

export interface StatsNzClientOptions {
  baseUrl?: string;
  subscriptionKey?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface StatsNzClient {
  getDataflowCatalogue(): Promise<StatsNzDataflow[]>;
  getData(request: StatsNzGetDataRequest): Promise<StatsNzObservation[]>;
  getCodelist(codelistId: string, options?: { version?: string }): Promise<StatsNzCodelist>;
}
