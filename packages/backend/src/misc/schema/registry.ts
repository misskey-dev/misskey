/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { schemaMeta } from './metadata.js';
import { unwrapPipe } from './introspect.js';
import type { AllOfPart, EntityName } from './metadata.js';
import type { AnyValibotSchema } from './introspect.js';

export type { EntityName };

/** name → schema。api.json の `components.schemas` を組み立てるのに使う */
let byName = new Map<EntityName, AnyValibotSchema>();

/**
 * schema → name。**逆引きで `$ref` を復元するための唯一の仕組み。**
 *
 * 「コード上はスキーマを直接 import、spec 上は `$ref`」を両立させるため、
 * 参照の同一性 (=== ) でレジストリ登録済み entity を検出する。
 */
let bySchema = new WeakMap<AnyValibotSchema, EntityName>();

/**
 * レジストリを空に戻す。**ユニットテスト専用。**
 *
 * 実 entity は `@/models/schema/_entities.js` の副作用 import で全登録されるため、
 * それを import グラフに含むテストがダミー entity を `defineEntity()` すると
 * 名前衝突で throw する。vitest はテストファイルごとにモジュールを分離するので、
 * テストファイル冒頭でこれを呼んでも他のテストや実行時挙動には影響しない。
 * プロダクションコードから呼んではならない。
 *
 * @internal
 */
export function resetEntityRegistry(): void {
	byName = new Map();
	bySchema = new WeakMap();
}

/**
 * Valibot 版 packed スキーマを `#/components/schemas/<name>` として公開登録する。
 *
 * ```ts
 * export const packedFooSchema = defineEntity('Foo', v.object({ ... }));
 * export type PackedFoo = v.InferOutput<typeof packedFooSchema>;
 * ```
 */
export function defineEntity<const N extends EntityName, S extends AnyValibotSchema>(name: N, schema: S): S {
	const registered = byName.get(name);
	if (registered != null && registered !== schema) {
		throw new Error(`defineEntity: entity '${name}' is already registered with a different schema`);
	}

	byName.set(name, schema);
	bySchema.set(schema, name);

	return schema;
}

/**
 * スキーマオブジェクトから登録済み entity 名を逆引きする。未登録なら `undefined`。
 */
export function lookupEntityName(schema: unknown): EntityName | undefined {
	if (typeof schema !== 'object' || schema === null) return undefined;
	return bySchema.get(schema as AnyValibotSchema);
}

/** entity 名から登録済みスキーマを引く。未登録なら `undefined` */
export function resolveEntity(name: EntityName): AnyValibotSchema | undefined {
	return byName.get(name);
}

/** 登録済み entity の一覧 (登録順) */
export function getRegisteredEntities(): ReadonlyMap<EntityName, AnyValibotSchema> {
	return byName;
}

type Flatten<T> = { [K in keyof T]: T[K] } & {};

type MergeTuple<T extends readonly unknown[]> =
	T extends readonly [infer H, ...infer R]
		? H & MergeTuple<R>
		: unknown;

/** {@link composeEntity} の入力型 (各パートの InferInput のマージ) */
export type ComposedInput<TParts extends readonly AnyValibotSchema[]> =
	Flatten<MergeTuple<{ [K in keyof TParts]: v.InferInput<TParts[K]> }>>;

/** {@link composeEntity} の出力型 (各パートの InferOutput のマージ) */
export type ComposedOutput<TParts extends readonly AnyValibotSchema[]> =
	Flatten<MergeTuple<{ [K in keyof TParts]: v.InferOutput<TParts[K]> }>>;

/**
 * legacy の `allOf` による entity 合成 (UserDetailedNotMe / Role 等) の置き換え。
 *
 * - **ランタイム / 型**: 各パートの entries を spread マージしたフラットな `v.object`
 *   (`UnionToIntersection` ハック不要、型が速く読みやすい)
 * - **OpenAPI**: `allOfParts` メタデータからコンバータが `allOf: [...]` を出力するので
 *   現行 api.json と差分ゼロ
 *
 * 各パートは object スキーマ (pipe 済みも可) でなければならない。パートは
 *
 * - {@link defineEntity} 済み → `allOf` には `{ $ref }` として出る
 * - 未登録のプレーンな `v.object` → `allOf` にはそのパートを展開した object として出る
 *   (legacy の `Role` のように `allOf` の一部だけが名前付き `ref` で残りが inline properties の混在パターン)
 *
 * のどちらでもよい。
 */
export function composeEntity<
	const N extends EntityName,
	const TParts extends readonly [AnyValibotSchema, ...AnyValibotSchema[]],
>(name: N, parts: TParts): v.GenericSchema<ComposedInput<TParts>, ComposedOutput<TParts>> {
	const allOfParts: AllOfPart[] = [];
	const merged: Record<string, AnyValibotSchema> = {};

	for (const part of parts) {
		const refName = lookupEntityName(part);

		const { base } = unwrapPipe(part);
		const entries = (base as { entries?: Record<string, AnyValibotSchema> }).entries;
		if (entries == null) {
			throw new Error(`composeEntity('${name}'): part '${refName ?? '(inline)'}' is not an object schema`);
		}

		// 登録済みなら名前 ($ref 用)、未登録ならスキーマそのもの (インライン展開用) を保持する
		allOfParts.push(refName ?? part);

		Object.assign(merged, entries);
	}

	const schema = v.pipe(v.object(merged), schemaMeta({ allOfParts: allOfParts as readonly AllOfPart[] }));

	// NOTE: entries を動的にマージしているため v.object の推論は使えない。外向きの型は
	// ComposedInput / ComposedOutput で表現する (パート同士のキーは互いに素である前提)。
	return defineEntity(name, schema as unknown as v.GenericSchema<ComposedInput<TParts>, ComposedOutput<TParts>>);
}
