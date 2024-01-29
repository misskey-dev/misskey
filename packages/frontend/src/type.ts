export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type WithNonNullable<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };
