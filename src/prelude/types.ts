export type Resolved<P> = P extends PromiseLike<infer R> ? R : never;
