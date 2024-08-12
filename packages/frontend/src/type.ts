/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type WithNonNullable<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;
export type Tuple<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never;
