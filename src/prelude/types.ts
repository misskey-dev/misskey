export type Resolved<P> = P extends PromiseLike<infer R> ? Resolved<R> : never;
