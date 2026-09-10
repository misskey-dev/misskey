/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import * as v from 'valibot';
import {
	anyObject,
	baseTypeOf,
	composeEntity,
	defineEntity,
	formatValibotIssues,
	getCastableParams,
	getParamTypes,
	idString,
	integer,
	isValibotSchema,
	limit,
	lookupEntityName,
	maxCodePoints,
	mergeMetadata,
	misskeyId,
	resAllowsEmpty,
	resolveEntity,
	toInvalidParamInfo,
	unwrapPipe,
} from '@/misc/schema/index.js';

describe('misc/schema:introspect', () => {
	describe('isValibotSchema()', () => {
		test('Valibot スキーマを判別する', () => {
			expect(isValibotSchema(v.string())).toBe(true);
			expect(isValibotSchema(v.object({ a: v.string() }))).toBe(true);
			expect(isValibotSchema(v.pipe(v.string(), maxCodePoints(1)))).toBe(true);
			expect(isValibotSchema(v.optional(v.string()))).toBe(true);
		});

		test('プレーンオブジェクト / アクション / その他は false', () => {
			expect(isValibotSchema({ type: 'object', properties: {} })).toBe(false);
			expect(isValibotSchema(maxCodePoints(1))).toBe(false);
			expect(isValibotSchema(null)).toBe(false);
			expect(isValibotSchema(undefined)).toBe(false);
			expect(isValibotSchema('string')).toBe(false);
		});
	});

	describe('unwrapPipe() / baseTypeOf()', () => {
		test('入れ子の pipe を平坦化しアクションを適用順に並べる', () => {
			const { base, actions } = unwrapPipe(v.pipe(v.pipe(v.string(), v.minLength(1)), v.maxLength(2)));
			expect(base.type).toBe('string');
			expect(actions.map(a => (a as { type: string }).type)).toStrictEqual(['min_length', 'max_length']);
		});

		test('baseTypeOf は pipe を剥がした type を返す', () => {
			expect(baseTypeOf(misskeyId())).toBe('string');
			expect(baseTypeOf(integer())).toBe('number');
			expect(baseTypeOf(v.optional(v.string()))).toBe('optional');
		});
	});

	describe('resAllowsEmpty()', () => {
		test('optional / nullable / nullish は空レスポンスを許す', () => {
			expect(resAllowsEmpty(v.optional(v.string()))).toBe(true);
			expect(resAllowsEmpty(v.nullable(v.string()))).toBe(true);
			expect(resAllowsEmpty(v.nullish(v.string()))).toBe(true);
			expect(resAllowsEmpty(v.string())).toBe(false);
			expect(resAllowsEmpty(v.object({ a: v.optional(v.string()) }))).toBe(false);
		});

		test('res 未定義なら false', () => {
			expect(resAllowsEmpty(undefined)).toBe(false);
			expect(resAllowsEmpty(null)).toBe(false);
		});
	});

	describe('v.InferOutput / v.InferInput (型レベル)', () => {
		test('入出力が分離される (default 付きキーは入力では省略可)', () => {
			const paramDef = v.object({
				limit: limit({ max: 100, def: 10 }),
				text: v.optional(v.string()),
			});

			// 出力型では default 付きキーが必須になる
			const output: v.InferOutput<typeof paramDef> = { limit: 10 };
			// 入力型では default 付きキーは省略できる
			const input: v.InferInput<typeof paramDef> = {};

			expect(v.parse(paramDef, input)).toStrictEqual(output);
		});
	});
});

describe('misc/schema:registry', () => {
	test('defineEntity / lookupEntityName / resolveEntity', () => {
		const schema = defineEntity('Hashtag', v.object({ tag: v.string() }));

		expect(lookupEntityName(schema)).toBe('Hashtag');
		expect(resolveEntity('Hashtag')).toBe(schema);
		expect(lookupEntityName(v.object({ tag: v.string() }))).toBeUndefined();
		expect(resolveEntity('Note')).toBeUndefined();
		expect(lookupEntityName(null)).toBeUndefined();
	});

	test('同名で別スキーマを登録すると throw する', () => {
		defineEntity('Ad', v.object({ id: idString() }));
		expect(() => defineEntity('Ad', v.object({ id: idString() }))).toThrow(/already registered/);
	});

	test('同一スキーマの再登録は冪等', () => {
		const schema = v.object({ id: idString() });
		expect(defineEntity('App', schema)).toBe(schema);
		expect(defineEntity('App', schema)).toBe(schema);
	});

	describe('composeEntity()', () => {
		const lite = defineEntity('UserLite', v.object({ id: idString(), name: v.nullable(v.string()) }));
		const detailedOnly = defineEntity('UserDetailedNotMeOnly', v.object({ isFollowing: v.optional(v.boolean()) }));

		test('entries をフラットにマージして登録する', () => {
			const composed = composeEntity('UserDetailedNotMe', [lite, detailedOnly]);

			expect(lookupEntityName(composed)).toBe('UserDetailedNotMe');
			const { base } = unwrapPipe(composed);
			expect(Object.keys((base as unknown as { entries: object }).entries))
				.toStrictEqual(['id', 'name', 'isFollowing']);

			// ランタイムはフラットな object として振る舞う
			expect(v.safeParse(composed, { id: 'abc', name: null }).success).toBe(true);
			expect(v.safeParse(composed, { id: 'abc' }).success).toBe(false);
		});

		test('未登録スキーマもパートにできる (allOfParts はスキーマ本体を保持する)', () => {
			// legacy の Role のような「ref + inline properties 混在の allOf」に対応するための拡張
			const inline = v.object({ x: v.string() });
			const composed = composeEntity('MeDetailed', [lite, inline]);

			const { base, actions } = unwrapPipe(composed);
			expect(Object.keys((base as unknown as { entries: object }).entries))
				.toStrictEqual(['id', 'name', 'x']);
			// 登録済みパートは名前、未登録パートはスキーマ本体で保持される
			expect(mergeMetadata(actions).allOfParts).toStrictEqual(['UserLite', inline]);

			expect(v.safeParse(composed, { id: 'abc', name: null, x: 'y' }).success).toBe(true);
			expect(v.safeParse(composed, { id: 'abc', name: null }).success).toBe(false);
		});

		test('object でないパートを渡すと throw する', () => {
			const notObject = defineEntity('AchievementName', v.string());
			expect(() => composeEntity('MeDetailedOnly', [lite, notObject]))
				.toThrow(/is not an object schema/);
		});
	});
});

describe('misc/schema:param-introspect', () => {
	test('boolean / number / integer を抽出する', () => {
		const paramDef = v.object({
			limit: limit({ max: 100, def: 10 }),
			userId: misskeyId(),
			withFiles: v.optional(v.boolean(), false),
			ratio: v.optional(v.number()),
			tags: v.optional(v.array(v.string())),
		});

		expect(getCastableParams(paramDef)).toStrictEqual({
			limit: 'integer',
			withFiles: 'boolean',
			ratio: 'number',
		});
	});

	test('optional / nullable / nullish を剥がして判定する', () => {
		expect(getCastableParams(v.object({
			a: v.nullable(v.boolean()),
			b: v.nullish(integer()),
			c: v.optional(v.nullable(v.number())),
		}))).toStrictEqual({ a: 'boolean', b: 'integer', c: 'number' });
	});

	test('トップレベルが object でなければ空', () => {
		expect(getCastableParams(v.union([v.object({ a: v.boolean() })]))).toStrictEqual({});
		expect(getCastableParams(v.string())).toStrictEqual({});
	});

	test('getParamTypes() は /endpoint API 用の {name, type} 一覧を返す', () => {
		const paramDef = v.object({
			userId: misskeyId(),
			limit: limit({ max: 100, def: 10 }),
			ratio: v.optional(v.number()),
			withFiles: v.nullish(v.boolean()),
			visibility: v.picklist(['public', 'home']),
			tags: v.optional(v.array(v.string())),
			extra: anyObject(),
			// 旧 paramDef でも `type` が書かれていなかったもの (= 無検証) は type なし
			whatever: v.any(),
		});

		expect(getParamTypes(paramDef)).toStrictEqual([
			{ name: 'userId', type: 'string' },
			{ name: 'limit', type: 'integer' },
			{ name: 'ratio', type: 'number' },
			{ name: 'withFiles', type: 'boolean' },
			{ name: 'visibility', type: 'string' },
			{ name: 'tags', type: 'array' },
			{ name: 'extra', type: 'object' },
			{ name: 'whatever', type: undefined },
		]);
	});

	test('getParamTypes(): トップレベルが object でなければ空', () => {
		expect(getParamTypes(v.union([v.object({ a: v.boolean() })]))).toStrictEqual([]);
	});
});

describe('misc/schema:error', () => {
	test('formatValibotIssues は dot-path を付ける', () => {
		const result = v.safeParse(v.object({ poll: v.object({ choices: v.array(v.string()) }) }), { poll: { choices: [1] } });
		expect(result.success).toBe(false);

		const details = formatValibotIssues(result.issues ?? []);
		expect(details).toHaveLength(1);
		expect(details[0].path).toBe('poll.choices.0');
		expect(details[0].kind).toBe('schema');
		expect(details[0].type).toBe('string');
		expect(details[0].expected).toBe('string');
		expect(details[0].received).toBe('1');
	});

	test('toInvalidParamInfo は param / reason / details を組み立てる', () => {
		const result = v.safeParse(v.object({ userId: misskeyId() }), { userId: 'has-hyphen' });
		const info = toInvalidParamInfo(result.issues ?? []);

		expect(info.param).toBe('userId');
		expect(typeof info.reason).toBe('string');
		expect(info.details).toHaveLength(1);
	});

	test('ルート自体のエラーは param が (root) になる', () => {
		const result = v.safeParse(v.object({ a: v.string() }), 'not an object');
		const info = toInvalidParamInfo(result.issues ?? []);

		expect(info.param).toBe('(root)');
	});

	test('複数エラーをまとめて返せる (Valibot は既定で全 issue を集める)', () => {
		const result = v.safeParse(v.object({ a: v.string(), b: v.number() }), { a: 1, b: 'x' });
		const info = toInvalidParamInfo(result.issues ?? []);

		expect(info.details.map(d => d.path)).toStrictEqual(['a', 'b']);
	});
});
