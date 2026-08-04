export type ApiEnvelope<T> = { data?: T; message?: string };
export type DataApiEnvelope<T> = { data: T; message?: string };

export type CustomerTemplateRouteContext = {
  params: Promise<{ id: string }>;
};

export type NextLotRouteContext = {
  params: Promise<{ id: string }>;
};
