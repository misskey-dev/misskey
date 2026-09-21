/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { unwrapPipe } from './introspect.js';
import { mergeMetadata } from './metadata.js';
import type { AnyValibotSchema } from './introspect.js';

/** JSON でないリクエスト (GET クエリ / multipart) から受けた文字列をキャストすべき型 */
export type CastableType = 'boolean' | 'number' | 'integer';

/** optional / nullable 系ラッパーを剥がす */
const WRAPPER_TYPES: ReadonlySet<string> = new Set([
	'optional', 'exact_optional', 'nullable', 'nullish', 'undefinedable',
	'non_optional', 'non_nullable', 'non_nullish',
]);

/**
 * GET / multipart リクエストで `JSON.parse` によるキャストが必要なトップレベルパラメータを抽出する。
 *
 * [ApiCallService](../../server/api/ApiCallService.ts) の "Cast non JSON input" 用。
 * 毎リクエストではなく endpoint 構築時に 1 回だけ求める。
 *
 * トップレベルが object でない場合 (union など) は空を返す。
 */
export function getCastableParams(paramDef: AnyValibotSchema): Record<string, CastableType> {
	const result: Record<string, CastableType> = {};

	const { base } = unwrapPipe(paramDef);
	const entries = (base as unknown as { entries?: Record<string, AnyValibotSchema> }).entries;
	if (entries == null) return result;

	for (const [key, entry] of Object.entries(entries)) {
		const type = castableTypeOf(entry);
		if (type != null) result[key] = type;
	}

	return result;
}

function castableTypeOf(schema: AnyValibotSchema): CastableType | undefined {
	const { base, actions } = unwrapWrappers(schema);

	if (base.type === 'boolean') return 'boolean';
	if (base.type === 'number') return isIntegerPipe(actions) ? 'integer' : 'number';

	return undefined;
}

/** optional / nullable 系のラッパーを剥がしつつ、通過した pipe のアクションも集める */
function unwrapWrappers(schema: AnyValibotSchema): { base: AnyValibotSchema, actions: readonly unknown[] } {
	let { base, actions } = unwrapPipe(schema);

	while (WRAPPER_TYPES.has(base.type)) {
		const wrapped = (base as unknown as { wrapped?: AnyValibotSchema }).wrapped;
		if (wrapped == null) break;
		const unwrapped = unwrapPipe(wrapped);
		base = unwrapped.base;
		actions = [...actions, ...unwrapped.actions];
	}

	return { base, actions };
}

function isIntegerPipe(actions: readonly unknown[]): boolean {
	return actions.some(action =>
		typeof action === 'object' && action !== null &&
		(action as { type?: unknown }).type === 'integer');
}

/** Valibot のスキーマ種別 → 旧 JSON Schema の `type` キーワード */
const JSON_SCHEMA_TYPES: ReadonlyMap<string, string> = new Map([
	['string', 'string'],
	['picklist', 'string'],
	['literal', 'string'],
	['enum', 'string'],
	['boolean', 'boolean'],
	['null', 'null'],
	['object', 'object'],
	['strict_object', 'object'],
	['loose_object', 'object'],
	['object_with_rest', 'object'],
	['record', 'object'],
	['array', 'array'],
	['tuple', 'array'],
	['strict_tuple', 'array'],
	['tuple_with_rest', 'array'],
	['variant', 'object'],
]);

/**
 * paramDef のトップレベルプロパティを `{ name, type }` の一覧として取り出す。
 *
 * `type` は旧 JSON Schema の `type` キーワード相当の文字列で、対応するキーワードが無いもの
 * (`v.any()` / `v.union()` / `v.custom()` など、旧 paramDef でも `type` が書かれていなかったもの) は
 * `undefined` になる。[endpoint.ts](../../server/api/endpoints/endpoint.ts) の `/endpoint` API 用。
 *
 * トップレベルが object でない場合 (union など) は空を返す (旧実装も `properties` が無ければ空だった)。
 */
export function getParamTypes(paramDef: AnyValibotSchema): { name: string, type: string | undefined }[] {
	const { base } = unwrapPipe(paramDef);
	const entries = (base as unknown as { entries?: Record<string, AnyValibotSchema> }).entries;
	if (entries == null) return [];

	return Object.entries(entries).map(([name, entry]) => ({ name, type: jsonSchemaTypeOf(entry) }));
}

function jsonSchemaTypeOf(schema: AnyValibotSchema): string | undefined {
	const { base, actions } = unwrapWrappers(schema);

	// `mi.openApi({ type: 'object' })` のように OpenAPI 上の type を明示しているものはそれを正とする
	// (cookbook R1 の「型は any のまま api.json 出力だけ合わせる」ケース)
	const rawType = mergeMetadata(actions).openApi?.type;
	if (typeof rawType === 'string') return rawType;

	if (base.type === 'number') return isIntegerPipe(actions) ? 'integer' : 'number';

	return JSON_SCHEMA_TYPES.get(base.type);
}
