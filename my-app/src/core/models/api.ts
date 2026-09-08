export type ApiEnvelope<T> = { data?: T; message?: string };

export type TemplateDetailRouteContext = {
  params: Promise<{ id: string }>;
};

export type NextLotRouteContext = {
  params: Promise<{ id: string }>;
};
