/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { schemaMeta, openApi, skipInOpenApi } from './metadata.js';

// #region markers

/**
 * 文字列長を **Unicode コードポイント数** で数える check アクションのマーカー。
 *
 * AJV の `minLength`/`maxLength` はコードポイント数で数えるが、`v.minLength`/`v.maxLength` は
 * UTF-16 コードユニット数で数えるため挙動が違う (サロゲートペアで 2 倍になる)。
 * 検証の意味を変えないため、文字列長制約は必ず {@link minCodePoints}/{@link maxCodePoints} を使う。
 */
export const CODE_POINTS_MARKER: unique symbol = Symbol('misskey:codePoints');

/** {@link uniqueArray} が付けるマーカー。OpenAPI の `uniqueItems: true` として出力される */
export const UNIQUE_ITEMS_MARKER: unique symbol = Symbol('misskey:uniqueItems');

export type CodePointsMarker = {
	readonly bound: 'min' | 'max';
	readonly requirement: number;
};

/** アクションから {@link CODE_POINTS_MARKER} を読む */
export function readCodePointsMarker(action: unknown): CodePointsMarker | undefined {
	if (typeof action !== 'object' || action === null) return undefined;
	return (action as Record<symbol, CodePointsMarker | undefined>)[CODE_POINTS_MARKER];
}

/** アクションが {@link UNIQUE_ITEMS_MARKER} を持つか */
export function hasUniqueItemsMarker(action: unknown): boolean {
	if (typeof action !== 'object' || action === null) return false;
	return (action as Record<symbol, unknown>)[UNIQUE_ITEMS_MARKER] === true;
}

// #endregion

/**
 * Misskey ID (aid/meid/ulid/objectid) の形。
 *
 * **この定数がプロジェクト唯一の正典** なので、各所で正規表現を書き写さないこと。
 */
export const MISSKEY_ID_REGEX = /^[a-zA-Z0-9]+$/;

/** Unicode コードポイント数を数える */
export function countCodePoints(value: string): number {
	return countCodePointsCapped(value, Infinity);
}

/**
 * Unicode コードポイント数を `cap + 1` まで数える (超えた時点で打ち切り)。
 *
 * `[...value].length` (spread) は呼び出しごとに全コードポイントの配列を確保するため、
 * リクエスト検証のホットパス (text / cw の長さ検査など) ではアロケーションなしの
 * ループで数える (AJV の `ucs2length` と同じ方式)。min/max 判定は上限+1 個まで
 * 数えれば決定できるので、長大な入力でも requirement 分しか走査しない。
 */
function countCodePointsCapped(value: string, cap: number): number {
	let count = 0;
	for (let i = 0; i < value.length && count <= cap; i++) {
		const c = value.charCodeAt(i);
		// high surrogate + low surrogate のペアは 1 コードポイントと数える
		if (c >= 0xD800 && c <= 0xDBFF && i + 1 < value.length) {
			const d = value.charCodeAt(i + 1);
			if (d >= 0xDC00 && d <= 0xDFFF) i++;
		}
		count++;
	}
	return count;
}

/**
 * `{ type: 'string', format: 'misskey:id' }` 相当。
 *
 * ランタイムでは {@link MISSKEY_ID_REGEX} で検証し、OpenAPI 上は `format: 'misskey:id'` のみを出す
 * (現行 api.json は `pattern` を出さないため regex アクションは変換対象外にしている)。
 */
export function misskeyId() {
	return v.pipe(
		v.string(),
		skipInOpenApi(v.regex(MISSKEY_ID_REGEX)),
		schemaMeta({ format: 'misskey:id' }),
	);
}

/**
 * `{ type: 'integer' }` 相当。`min` / `max` を渡すと `minimum` / `maximum` も付く。
 */
export function integer(opts: { min?: number, max?: number } = {}): v.GenericSchema<number> {
	if (opts.min !== undefined && opts.max !== undefined) {
		return v.pipe(v.number(), v.integer(), v.minValue(opts.min), v.maxValue(opts.max));
	}
	if (opts.min !== undefined) return v.pipe(v.number(), v.integer(), v.minValue(opts.min));
	if (opts.max !== undefined) return v.pipe(v.number(), v.integer(), v.maxValue(opts.max));
	return v.pipe(v.number(), v.integer());
}

export type LimitOptions = {
	/** `maximum` */
	readonly max: number;
	/** `default`。省略すると default なし (= 入力必須ではないが補完もされない) */
	readonly def?: number;
	/** `minimum` (既定 1) */
	readonly min?: number;
};

/**
 * ページネーションの `limit`: `{ type: 'integer', minimum: 1, maximum: max, default: def }` 相当。
 */
// NOTE: 戻り値を GenericSchema に潰すと valibot が「入力ではキー省略可」を推論できなくなるため
// (OptionalInputKeys が OptionalSchema を構造的に判定する)、default 付きは OptionalSchema を返す
export function limit(opts: LimitOptions & { def: number }): v.OptionalSchema<v.GenericSchema<number>, number>;
export function limit(opts: LimitOptions & { def?: undefined }): v.GenericSchema<number>;
export function limit(opts: LimitOptions): v.OptionalSchema<v.GenericSchema<number>, number> | v.GenericSchema<number> {
	const base = integer({ min: opts.min ?? 1, max: opts.max });
	return opts.def === undefined ? base : v.optional(base, opts.def);
}

/** res 側の `{ type: 'string', format: 'id' }` 相当 (ランタイム検証なし) */
export function idString() {
	return v.pipe(v.string(), schemaMeta({ format: 'id' }));
}

/** res 側の `{ type: 'string', format: 'date-time' }` 相当 (ランタイム検証なし) */
export function dateTimeString() {
	return v.pipe(v.string(), schemaMeta({ format: 'date-time' }));
}

/** res 側の `{ type: 'string', format: 'url' }` 相当 (ランタイム検証なし) */
export function urlString() {
	return v.pipe(v.string(), schemaMeta({ format: 'url' }));
}

/**
 * 文字列の `minLength` 相当 (**コードポイント数**)。
 *
 * @see {@link CODE_POINTS_MARKER}
 */
export function minCodePoints(requirement: number) {
	return Object.assign(
		v.check<string, string>(
			// requirement 個数えられた時点で成立が決まる (打ち切り)
			(input) => countCodePointsCapped(input, requirement) >= requirement,
			`Invalid length: Expected >=${requirement} code points`,
		),
		{ [CODE_POINTS_MARKER]: { bound: 'min', requirement } as CodePointsMarker },
	);
}

/**
 * 文字列の `maxLength` 相当 (**コードポイント数**)。
 *
 * @see {@link CODE_POINTS_MARKER}
 */
export function maxCodePoints(requirement: number) {
	return Object.assign(
		v.check<string, string>(
			// requirement + 1 個目が見つかった時点で違反が決まる (打ち切り)
			(input) => countCodePointsCapped(input, requirement) <= requirement,
			`Invalid length: Expected <=${requirement} code points`,
		),
		{ [CODE_POINTS_MARKER]: { bound: 'max', requirement } as CodePointsMarker },
	);
}

/**
 * 配列の `uniqueItems: true` 相当。
 *
 * `Set` による同一性比較なので **プリミティブ要素の配列専用**
 */
export function uniqueArray() {
	return Object.assign(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		v.check<any[], string>(
			(input) => new Set(input).size === input.length,
			'Invalid array: Expected unique items',
		),
		{ [UNIQUE_ITEMS_MARKER]: true as const },
	);
}

/**
 * `enum` に `null` を含む legacy スキーマ
 * (`{ type: 'string', nullable: true, enum: [null, 'a', 'b'] }`) 相当。
 *
 * ランタイムは `v.nullable(v.picklist(nullを除いた値))` と等価で、OpenAPI 上は
 * **渡した配列をそのままの順序で** `enum` として出力する (現行 api.json とバイト等価にするため)。
 */
export function nullableEnum<const T extends readonly (string | null)[]>(options: T): v.GenericSchema<Extract<T[number], string> | null> {
	const values = options.filter((x): x is Extract<T[number], string> => x !== null);
	// NOTE: picklist の options は string[] としてしか型付けできないので、外向きの型は明示注釈で絞る
	return v.pipe(
		v.nullable(v.picklist(values)),
		schemaMeta({ openApi: { enum: [...options] } }),
	) as unknown as v.GenericSchema<Extract<T[number], string> | null>;
}

/**
 * cookbook R1 の「`properties` 無しの object」= `{ type: 'object' }` 相当。
 *
 * ハンドラ側が任意のキーへアクセスするため `v.unknown()` ではなく `v.any()` を値に使う。
 * コンバータは値が `v.any()` の record を `additionalProperties` 無しで出力する。
 */
export function anyObject() {
	return v.record(v.string(), v.any());
}

/**
 * 明示的な `{ type: 'object', additionalProperties: true }` 相当。
 *
 * ランタイム挙動は {@link anyObject} と同じで、OpenAPI 出力だけが違う
 * (現行 `additionalProperties: true` を書いている fetch-rss / pages/* / meta.ts 用)。
 */
export function anyRecord() {
	return v.pipe(v.record(v.string(), v.any()), openApi({ additionalProperties: true }));
}

/**
 * cookbook R1 の「`items` 無しの array」= `{ type: 'array' }` 相当。
 *
 * ハンドラ側が要素へ自由にアクセスするため `v.unknown()` ではなく `v.any()` を要素に使う。
 */
export function anyArray() {
	return v.array(v.any());
}

/**
 * ページネーション 3 点セット (`limit` / `sinceId` / `untilId`) の entries 断片。
 *
 * ```ts
 * export const paramDef = v.object({
 *   ...paginationEntries({ max: 100, default: 10 }),
 *   userId: misskeyId(),
 * });
 * ```
 */
export function paginationEntries(opts: { max: number, default: number, min?: number }) {
	return {
		limit: limit({ max: opts.max, def: opts.default, min: opts.min }),
		sinceId: v.optional(misskeyId()),
		untilId: v.optional(misskeyId()),
	};
}

/**
 * `sinceDate` / `untilDate` の entries 断片。
 *
 * 現行のプロパティ順 (`limit, sinceId, untilId, sinceDate, untilDate`) を保つため、
 * {@link paginationEntries} の直後に spread すること。
 */
export function paginationDateEntries() {
	return {
		sinceDate: v.optional(integer()),
		untilDate: v.optional(integer()),
	};
}
