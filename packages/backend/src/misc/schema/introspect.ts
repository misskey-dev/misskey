/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';

/**
 * 任意の (同期) Valibot スキーマ。
 *
 * `v.GenericSchema` のエイリアス。パイプ済みスキーマ (`v.SchemaWithPipe`) もこれを満たす。
 *
 * endpoint の `paramDef` / `meta.res` に指定できるスキーマでもある
 * (出力型は `v.InferOutput<...>`、入力型は `v.InferInput<...>` で取る)。
 */
export type AnyValibotSchema = v.GenericSchema;

/**
 * Valibot スキーマか否かを判別する。
 *
 * OpenAPI コンバータのように `unknown` を受ける入口で使う型ガード。
 */
export function isValibotSchema(x: unknown): x is AnyValibotSchema {
	return typeof x === 'object' && x !== null &&
		(x as { kind?: unknown }).kind === 'schema' &&
		'~standard' in x;
}

/**
 * `v.pipe()` を平坦化し、ベーススキーマとアクション列 (適用順) に分解する。
 *
 * `v.pipe(v.pipe(v.string(), a), b)` のような入れ子も `{ base: string, actions: [a, b] }` に正規化する。
 */
export function unwrapPipe(schema: AnyValibotSchema): { base: AnyValibotSchema, actions: readonly unknown[] } {
	const actions: unknown[] = [];
	let current = schema as AnyValibotSchema & { pipe?: readonly unknown[] };

	while (Array.isArray(current.pipe)) {
		const [first, ...rest] = current.pipe;
		actions.unshift(...rest);
		current = first as AnyValibotSchema & { pipe?: readonly unknown[] };
	}

	return { base: current, actions };
}

/**
 * pipe を剥がしたベーススキーマの `type` を返す。
 */
export function baseTypeOf(schema: AnyValibotSchema): string {
	return unwrapPipe(schema).base.type;
}

/** 値が「省略可能」であることを表すラッパー種別 (= OpenAPI の required から除外される) */
const ABSENTABLE_TYPES: ReadonlySet<string> = new Set(['optional', 'exact_optional', 'nullish', 'undefinedable']);

/** 値が null を許容するラッパー種別 */
const NULLABLE_TYPES: ReadonlySet<string> = new Set(['nullable', 'nullish']);

/**
 * `undefined` (キー欠落) を許容するスキーマか。object の `required` 導出に使う。
 */
export function allowsAbsent(schema: AnyValibotSchema): boolean {
	return ABSENTABLE_TYPES.has(baseTypeOf(schema));
}

/**
 * `res` が「空レスポンス (204) もありうる」ことを表しているか
 * (= optional / nullable / nullish ラッパーで包まれているか)。
 */
export function resAllowsEmpty(res: AnyValibotSchema | undefined | null): boolean {
	if (res == null) return false;

	const type = baseTypeOf(res);
	return ABSENTABLE_TYPES.has(type) || NULLABLE_TYPES.has(type);
}
