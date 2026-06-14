type PagesFunction<Env = unknown> = (context: EventContext<Env, string, unknown>) => Response | Promise<Response>;
type EventContext<Env, P extends string, Data> = { request: Request; env: Env; params: Record<P, string>; data: Data; waitUntil(promise: Promise<unknown>): void; next(input?: Request | string, init?: RequestInit): Promise<Response>; };
