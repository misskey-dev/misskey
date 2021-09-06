export type Resolved<P extends Promise<any>> = P extends Promise<infer R> ? R : never;
