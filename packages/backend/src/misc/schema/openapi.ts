/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { allowsAbsent, isValibotSchema, unwrapPipe } from './introspect.js';
import { isSkippedInOpenApi, mergeMetadata } from './metadata.js';
import { hasUniqueItemsMarker, readCodePointsMarker } from './helpers.js';
import { lookupEntityName } from './registry.js';
import type { AnyValibotSchema } from './introspect.js';
import type { CollectedMetadata, EntityName } from './metadata.js';

/** 生成される OpenAPI (3.1) スキーマオブジェクト */
export type OpenApiSchemaObject = Record<string, unknown>;

export type ValibotOpenApiContext = {
	/**
	 * `'param'`: requestBody 用 / `'res'`: response 用。
	 *
	 * `'param'` では `v.transform` 等の変換アクションを検出したら throw する
	 * (クライアントに提示できない変換をパラメータスキーマに書くのは禁止)。
	 */
	readonly use: 'param' | 'res';
	/** legacy の `selfRef` 相当のマーカーが付いた参照を `$ref` として出すか */
	readonly includeSelfRef: boolean;
	/**
	 * ルートノード自身が entity として登録されている場合の名前。
	 *
	 * `components.schemas.<name>` の本体を生成するときに渡す。これが無いと
	 * ルートが自分自身への `$ref` になってしまう。
	 */
	readonly rootName?: string;
};

type ConvertState = {
	readonly isRoot: boolean;
	/** `v.lazy` の循環検出用 (現在のパス上で評価中の lazy ノード) */
	readonly lazyPath: readonly object[];
};

/**
 * Valibot スキーマを Misskey の api.json 規約に沿った OpenAPI スキーマへ変換する。
 *
 * legacy の [convertSchemaToOpenApiSchema](../../server/api/openapi/schemas.ts) と
 * **意味的に等価な出力** (nullable の表現、`$ref` の出し方、res のみ required 導出、
 * `format: 'misskey:id'` 保持、selfRef 分岐) を返すことが受け入れ条件。
 *
 * プロパティの出力順序は `v.object` の entries 挿入順を保存する (順序が揺れると
 * api.json の差分検証が破綻するため)。
 */
export function valibotToOpenApi(schema: AnyValibotSchema, ctx: ValibotOpenApiContext): OpenApiSchemaObject {
	return convert(schema, ctx, { isRoot: true, lazyPath: [] });
}

function convert(schema: unknown, ctx: ValibotOpenApiContext, state: ConvertState): OpenApiSchemaObject {
	if (!isValibotSchema(schema)) {
		throw new Error(`valibotToOpenApi: not a valibot schema: ${JSON.stringify(schema)}`);
	}

	const { base, actions } = unwrapPipe(schema);
	const meta = mergeMetadata(actions);

	if (ctx.use === 'param') {
		assertNoTransformation(actions, base.type);
	}

	// 全ノード共通の前処理: 登録済み entity は潜らずに $ref にする。
	// ルートノード自身が対象 entity のときだけ展開する (そうしないと自己参照になる)。
	const entityName = lookupEntityName(schema);
	if (entityName != null && !(state.isRoot && entityName === ctx.rootName)) {
		return refObject(entityName, meta, ctx);
	}

	switch (base.type) {
		case 'optional':
		case 'exact_optional':
		case 'undefinedable': {
			const out = convert(wrappedOf(base), ctx, { ...state, isRoot: false });
			applyDefault(out, base);
			// NOTE: ラッパー自身の pipe に載ったメタデータも反映する
			// (`v.pipe(v.nullable(...), openApi({ ... }))` のようなケース)
			return applyExtras(out, meta);
		}

		case 'nullable':
		case 'nullish': {
			const out = convert(wrappedOf(base), ctx, { ...state, isRoot: false });
			applyNullable(out);
			applyDefault(out, base);
			return applyExtras(out, meta);
		}

		case 'non_optional':
		case 'non_nullable':
		case 'non_nullish':
			return applyExtras(convert(wrappedOf(base), ctx, { ...state, isRoot: false }), meta);

		case 'any':
		case 'unknown':
			return applyExtras({}, meta);

		case 'null':
			return applyExtras({ type: 'null' }, meta);

		case 'boolean':
			return applyExtras({ type: 'boolean' }, meta);

		case 'string':
			return applyExtras(applyActions({ type: 'string' }, actions), meta);

		case 'number':
			return applyExtras(applyActions({ type: 'number' }, actions), meta);

		case 'literal': {
			const literal = (base as unknown as { literal: unknown }).literal;
			return applyExtras(enumObject([literal]), meta);
		}

		case 'picklist':
			return applyExtras(enumObject((base as unknown as { options: readonly unknown[] }).options), meta);

		case 'enum':
			return applyExtras(enumObject((base as unknown as { options: readonly unknown[] }).options), meta);

		case 'object':
		case 'strict_object':
		case 'loose_object':
		case 'object_with_rest': {
			// composeEntity() が付ける allOf 合成マーカー。properties は出力しない
			if (meta.allOfParts != null) {
				return applyExtras({
					type: 'object',
					allOf: meta.allOfParts.map(part => typeof part === 'string'
						// 登録済みパート → $ref
						? { $ref: refPath(part) }
						// 未登録のインラインパート → その場で展開する (legacy の「ref の無い allOf 要素」)
						: convert(part, ctx, { ...state, isRoot: false })),
				}, meta);
			}

			const entries = (base as unknown as { entries: Record<string, AnyValibotSchema> }).entries;
			const properties: OpenApiSchemaObject = {};
			const required: string[] = [];

			// NOTE: entries の挿入順を保存する (出力順序の安定性は api.json 差分検証の前提)
			for (const [key, entry] of Object.entries(entries)) {
				properties[key] = convert(entry, ctx, { ...state, isRoot: false });
				if (!allowsAbsent(entry)) required.push(key);
			}

			const out: OpenApiSchemaObject = { type: 'object', properties };

			if (base.type === 'strict_object') {
				out.additionalProperties = false;
			} else if (base.type === 'object_with_rest') {
				const rest = additionalPropertiesOf((base as unknown as { rest: AnyValibotSchema }).rest, ctx, state);
				if (rest !== undefined) out.additionalProperties = rest;
			}

			// 空配列は OpenAPI 上許可されないので省略する
			if (required.length > 0) out.required = required;

			return applyExtras(out, meta);
		}

		case 'record': {
			const out: OpenApiSchemaObject = { type: 'object' };
			const value = additionalPropertiesOf((base as unknown as { value: AnyValibotSchema }).value, ctx, state);
			if (value !== undefined) out.additionalProperties = value;
			return applyExtras(out, meta);
		}

		case 'array': {
			const out: OpenApiSchemaObject = { type: 'array' };
			const item = (base as unknown as { item: AnyValibotSchema }).item;
			// NOTE: `v.array(v.any())` は legacy の「items 無し array」(`{ type: 'array' }`) に対応する
			if (!isAnyish(item)) out.items = convert(item, ctx, { ...state, isRoot: false });
			return applyExtras(applyActions(out, actions), meta);
		}

		case 'tuple':
		case 'loose_tuple':
		case 'strict_tuple': {
			const items = (base as unknown as { items: readonly AnyValibotSchema[] }).items;
			const out: OpenApiSchemaObject = {
				type: 'array',
				prefixItems: items.map(item => convert(item, ctx, { ...state, isRoot: false })),
			};
			// legacy の `prefixItems` + `unevaluatedItems: false` (admin/queue/*-delayed) と同形
			if (base.type === 'strict_tuple') out.unevaluatedItems = false;
			return applyExtras(applyActions(out, actions), meta);
		}

		case 'tuple_with_rest': {
			const items = (base as unknown as { items: readonly AnyValibotSchema[], rest: AnyValibotSchema }).items;
			const out: OpenApiSchemaObject = {
				type: 'array',
				prefixItems: items.map(item => convert(item, ctx, { ...state, isRoot: false })),
				items: convert((base as unknown as { rest: AnyValibotSchema }).rest, ctx, { ...state, isRoot: false }),
			};
			return applyExtras(applyActions(out, actions), meta);
		}

		case 'union': {
			const options = (base as unknown as { options: readonly AnyValibotSchema[] }).options;
			const keyword = meta.unionKeyword ?? 'anyOf';

			// `[T, v.null()]` の形は type 配列に畳む (legacy の nullable 表現に一致させる)
			const nullIndex = options.findIndex(option => unwrapPipe(option).base.type === 'null');
			if (nullIndex >= 0) {
				const rest = options.filter((_, i) => i !== nullIndex);
				const out = rest.length === 1
					? convert(rest[0], ctx, { ...state, isRoot: false })
					: { [keyword]: rest.map(option => convert(option, ctx, { ...state, isRoot: false })) };
				applyNullable(out);
				return applyExtras(out, meta);
			}

			return applyExtras({
				[keyword]: options.map(option => convert(option, ctx, { ...state, isRoot: false })),
			}, meta);
		}

		case 'variant': {
			const options = (base as unknown as { options: readonly AnyValibotSchema[] }).options;
			// 判別 union は必ず object の集合なので legacy 同様 `type: 'object'` を併記する
			return applyExtras({
				type: 'object',
				oneOf: options.map(option => convert(option, ctx, { ...state, isRoot: false })),
			}, meta);
		}

		case 'intersect': {
			const options = (base as unknown as { options: readonly AnyValibotSchema[] }).options;
			return applyExtras({
				allOf: options.map(option => convert(option, ctx, { ...state, isRoot: false })),
			}, meta);
		}

		case 'lazy': {
			if (state.lazyPath.includes(base)) {
				throw new Error('valibotToOpenApi: unresolvable circular v.lazy() (target entity is not registered via defineEntity())');
			}

			const getter = (base as unknown as { getter: (input: unknown) => AnyValibotSchema }).getter;
			const resolved = getter(undefined);

			const resolvedName = lookupEntityName(resolved);
			if (resolvedName != null) {
				return refObject(resolvedName, meta, ctx);
			}

			return convert(resolved, ctx, { isRoot: false, lazyPath: [...state.lazyPath, base] });
		}

		case 'custom':
			// v.custom は形を推測できないので、メタデータで補うものとして扱う
			return applyExtras({}, meta);

		default:
			throw new Error(`valibotToOpenApi: unsupported schema type '${base.type}'`);
	}
}

// #region helpers

function refPath(name: EntityName | string): string {
	return `#/components/schemas/${name}`;
}

/**
 * `$ref` ノードを作る。
 *
 * legacy の `selfRef: true` 相当のマーカーが付いていて `includeSelfRef === false` のときは
 * `$ref` を出さず `{ type: 'object' }` に退化させる (現行の selfRef 挙動の再現)。
 */
function refObject(name: EntityName | string, meta: CollectedMetadata, ctx: ValibotOpenApiContext): OpenApiSchemaObject {
	if (meta.selfRef === true && !ctx.includeSelfRef) {
		return applyExtras({ type: 'object' }, meta);
	}

	return applyExtras({ $ref: refPath(name) }, meta);
}

function wrappedOf(base: AnyValibotSchema): AnyValibotSchema {
	return (base as unknown as { wrapped: AnyValibotSchema }).wrapped;
}

/**
 * `v.optional(x, def)` / `v.nullish(x, def)` の default を出力する。
 *
 * default 付きのキーは required から除外される ({@link allowsAbsent} 参照)
 */
function applyDefault(out: OpenApiSchemaObject, base: AnyValibotSchema): void {
	if (!('default' in base)) return;

	// NOTE: default は値でも関数でもありうるので getDefault() で評価する
	const value: unknown = v.getDefault(base as Parameters<typeof v.getDefault>[0]);
	if (value === undefined) return;

	out.default = value;
}

/**
 * nullable を legacy と同じ形で反映する (in-place)。
 *
 * - 中身が `$ref` → `{ oneOf: [{ $ref }, { type: 'null' }] }`
 * - 中身が単一 type → `type: [T, 'null']` (キーの位置は保つ)
 * - 中身が type 配列 → `'null'` を追加
 * - type を持たない (anyOf 等) → `{ oneOf: [inner, { type: 'null' }] }`
 *   (legacy はこのケースで nullable を黙って捨てていたが、現行スキーマに該当例は無い)
 */
function applyNullable(out: OpenApiSchemaObject): void {
	if ('$ref' in out) {
		const $ref = out.$ref;
		delete out.$ref;
		out.oneOf = [{ $ref }, { type: 'null' }];
		delete out.type;
		return;
	}

	if (Array.isArray(out.type)) {
		if (!out.type.includes('null')) out.type.push('null');
		return;
	}

	if (typeof out.type === 'string') {
		out.type = [out.type, 'null'];
		return;
	}

	const inner = { ...out };
	for (const key of Object.keys(out)) delete out[key];
	out.oneOf = [inner, { type: 'null' }];
}

/** pipe を剥がしたベースが `v.any()` / `v.unknown()` か */
function isAnyish(schema: AnyValibotSchema): boolean {
	const type = unwrapPipe(schema).base.type;
	return type === 'any' || type === 'unknown';
}

/**
 * `v.record()` / `v.objectWithRest()` の値スキーマを `additionalProperties` へ変換する。
 *
 * 値が `v.any()` / `v.unknown()` のときは `undefined` を返し、呼び出し側が
 * `additionalProperties` を出力しない (legacy の「properties も additionalProperties も無い
 * object」= `{ type: 'object' }` と一致させる。cookbook R1 の変換先がこれ)。
 * 明示的に `additionalProperties: true` を出したい場合は `anyRecord()` を使う。
 */
function additionalPropertiesOf(value: AnyValibotSchema, ctx: ValibotOpenApiContext, state: ConvertState): unknown {
	if (isAnyish(value)) return undefined;
	return convert(value, ctx, { ...state, isRoot: false });
}

const JSON_TYPE_OF_JS_TYPE: Readonly<Partial<Record<string, string>>> = {
	string: 'string',
	number: 'number',
	boolean: 'boolean',
	bigint: 'integer',
};

/**
 * `v.picklist` / `v.enum` / `v.literal` を `{ type, enum: [...] }` へ変換する。
 *
 * 現行 api.json は 1 値の enum (legacy の `enum: ['text']`) も `const` ではなく `enum` で出しているので、
 * literal も `enum` に落とす。値の型が混在する場合は `type` を省略する。
 */
function enumObject(options: readonly unknown[]): OpenApiSchemaObject {
	const types = new Set<string>();
	for (const option of options) {
		if (option === null) continue;
		const jsonType = JSON_TYPE_OF_JS_TYPE[typeof option];
		if (jsonType !== undefined) types.add(jsonType);
	}

	const out: OpenApiSchemaObject = {};
	if (types.size === 1) out.type = [...types][0];
	out.enum = [...options];
	return out;
}

/**
 * pipe 上の validation アクションを OpenAPI キーワードへ反映する (in-place)。
 *
 * OpenAPI で表現できない check / rawCheck 等は黙って無視する (spec 上の説明が欠けるだけで
 * ランタイム検証は変わらない)。
 */
function applyActions(out: OpenApiSchemaObject, actions: readonly unknown[]): OpenApiSchemaObject {
	const isArray = out.type === 'array';

	for (const action of actions) {
		if (typeof action !== 'object' || action === null) continue;
		if (isSkippedInOpenApi(action)) continue;

		const a = action as { kind?: unknown, type?: unknown, requirement?: unknown };

		const codePoints = readCodePointsMarker(action);
		if (codePoints != null) {
			out[codePoints.bound === 'min' ? 'minLength' : 'maxLength'] = codePoints.requirement;
			continue;
		}

		if (hasUniqueItemsMarker(action)) {
			out.uniqueItems = true;
			continue;
		}

		if (a.kind !== 'validation') continue;

		switch (a.type) {
			case 'integer':
				out.type = 'integer';
				break;
			case 'regex':
				out.pattern = (a.requirement as RegExp).source;
				break;
			case 'min_value':
				out.minimum = a.requirement;
				break;
			case 'max_value':
				out.maximum = a.requirement;
				break;
			case 'gt_value':
				out.exclusiveMinimum = a.requirement;
				break;
			case 'lt_value':
				out.exclusiveMaximum = a.requirement;
				break;
			case 'multiple_of':
				out.multipleOf = a.requirement;
				break;
			case 'min_length':
				out[isArray ? 'minItems' : 'minLength'] = a.requirement;
				break;
			case 'max_length':
				out[isArray ? 'maxItems' : 'maxLength'] = a.requirement;
				break;
			case 'length':
				out[isArray ? 'minItems' : 'minLength'] = a.requirement;
				out[isArray ? 'maxItems' : 'maxLength'] = a.requirement;
				break;
			default:
				// OpenAPI に対応キーワードが無いものは無視する
				break;
		}
	}

	return out;
}

/**
 * メタデータ由来のキーワード (format / example / description / title / deprecated / 生 openApi) を
 * 反映する (in-place)。`omitKeywords` は最後に適用する。
 */
function applyExtras(out: OpenApiSchemaObject, meta: CollectedMetadata): OpenApiSchemaObject {
	if (meta.format != null) out.format = meta.format;
	if ('example' in meta) out.example = meta.example;
	if (meta.deprecated === true) out.deprecated = true;
	if (meta.description != null) out.description = meta.description;
	if (meta.title != null) out.title = meta.title;

	if (meta.openApi != null) Object.assign(out, meta.openApi);
	if (meta.omitKeywords != null) {
		for (const key of meta.omitKeywords) delete out[key];
	}

	return out;
}

function assertNoTransformation(actions: readonly unknown[], baseType: string): void {
	for (const action of actions) {
		if (typeof action !== 'object' || action === null) continue;
		if ((action as { kind?: unknown }).kind !== 'transformation') continue;

		const type = (action as { type?: unknown }).type;
		throw new Error(`valibotToOpenApi: transformation action '${String(type)}' is not allowed in a param schema (on '${baseType}'). See the migration cookbook.`);
	}
}

// #endregion
