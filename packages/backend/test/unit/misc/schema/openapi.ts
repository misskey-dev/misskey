/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import * as v from 'valibot';
import {
	anyArray,
	anyObject,
	anyRecord,
	asOneOf,
	composeEntity,
	dateTimeString,
	defineEntity,
	example,
	idString,
	integer,
	limit,
	maxCodePoints,
	minCodePoints,
	misskeyId,
	nullableEnum,
	omitKeywords,
	openApi,
	paginationEntries,
	resetEntityRegistry,
	selfRef,
	uniqueArray,
	valibotToOpenApi,
} from '@/misc/schema/index.js';
import type { AnyValibotSchema, ValibotOpenApiContext } from '@/misc/schema/index.js';

// import グラフに `@/models/schema/_entities.js` の副作用 import が含まれ、実 entity が
// 全登録された状態になる。このテストのダミー `defineEntity()` が名前衝突で throw しないよう、
// レジストリを空に戻してから始める
// (vitest はファイル単位でモジュールを分離するため他のテストには影響しない)。
resetEntityRegistry();

const RES: ValibotOpenApiContext = { use: 'res', includeSelfRef: true };
const PARAM: ValibotOpenApiContext = { use: 'param', includeSelfRef: false };

// `$ref` 出力の確認用ダミー entity (実 entity の中身には依存しない)
const refAntennaSchema = defineEntity('Antenna', v.object({ id: idString() }));
const refBlockingSchema = defineEntity('Blocking', v.object({ id: idString() }));
const refClipSchema = defineEntity('Clip', v.object({ id: idString() }));

describe('misc/schema:valibotToOpenApi', () => {
	describe('primitives', () => {
		test('string / number / boolean / null', () => {
			expect(valibotToOpenApi(v.string(), RES)).toStrictEqual({ type: 'string' });
			expect(valibotToOpenApi(v.number(), RES)).toStrictEqual({ type: 'number' });
			expect(valibotToOpenApi(v.boolean(), RES)).toStrictEqual({ type: 'boolean' });
			expect(valibotToOpenApi(v.null(), RES)).toStrictEqual({ type: 'null' });
		});

		test('any / unknown は空スキーマ', () => {
			expect(valibotToOpenApi(v.any(), RES)).toStrictEqual({});
			expect(valibotToOpenApi(v.unknown(), RES)).toStrictEqual({});
		});

		test('integer アクションは type: integer になる', () => {
			expect(valibotToOpenApi(integer(), RES)).toStrictEqual({ type: 'integer' });
			expect(valibotToOpenApi(integer({ min: 1, max: 10 }), RES))
				.toStrictEqual({ type: 'integer', minimum: 1, maximum: 10 });
		});

		test('regex → pattern (legacy の pattern 文字列と同じ)', () => {
			expect(valibotToOpenApi(v.pipe(v.string(), v.regex(/^[a-zA-Z/\-*]+$/)), RES))
				.toStrictEqual({ type: 'string', pattern: '^[a-zA-Z/\\-*]+$' });
		});

		test('misskeyId() は format だけを出し pattern は出さない', () => {
			expect(valibotToOpenApi(misskeyId(), RES)).toStrictEqual({ type: 'string', format: 'misskey:id' });
		});

		test('format / example / description メタデータ', () => {
			expect(valibotToOpenApi(v.pipe(idString(), example('xxxxxxxxxx')), RES))
				.toStrictEqual({ type: 'string', format: 'id', example: 'xxxxxxxxxx' });
			// cookbook R12 のラップ形式も同じ出力になる
			expect(valibotToOpenApi(example(idString(), 'xxxxxxxxxx'), RES))
				.toStrictEqual({ type: 'string', format: 'id', example: 'xxxxxxxxxx' });
			expect(valibotToOpenApi(v.pipe(dateTimeString(), v.description('when')), RES))
				.toStrictEqual({ type: 'string', format: 'date-time', description: 'when' });
		});

		test('codePoints マーカー → minLength / maxLength', () => {
			expect(valibotToOpenApi(v.pipe(v.string(), minCodePoints(1), maxCodePoints(100)), RES))
				.toStrictEqual({ type: 'string', minLength: 1, maxLength: 100 });
		});

		test('OpenAPI に写せない check は無視される', () => {
			expect(valibotToOpenApi(v.pipe(v.string(), v.check<string>(() => true)), RES)).toStrictEqual({ type: 'string' });
		});
	});

	describe('enum', () => {
		test('picklist → { type, enum }', () => {
			expect(valibotToOpenApi(v.picklist(['public', 'home']), RES))
				.toStrictEqual({ type: 'string', enum: ['public', 'home'] });
		});

		test('literal は const ではなく enum (現行 api.json と同形)', () => {
			expect(valibotToOpenApi(v.literal('text'), RES)).toStrictEqual({ type: 'string', enum: ['text'] });
		});

		test('v.enum → { type, enum }', () => {
			expect(valibotToOpenApi(v.enum({ A: 'a', B: 'b' }), RES))
				.toStrictEqual({ type: 'string', enum: ['a', 'b'] });
		});

		test('nullableEnum は null 込みの enum を順序どおり出す', () => {
			expect(valibotToOpenApi(nullableEnum([null, 'likeOnly']), RES))
				.toStrictEqual({ type: ['string', 'null'], enum: [null, 'likeOnly'] });
			expect(valibotToOpenApi(nullableEnum(['likeOnly', null]), RES))
				.toStrictEqual({ type: ['string', 'null'], enum: ['likeOnly', null] });
		});

		test('型が混在する enum は type を省略する', () => {
			expect(valibotToOpenApi(v.picklist([1, 'a']), RES)).toStrictEqual({ enum: [1, 'a'] });
		});
	});

	describe('array / tuple', () => {
		test('array → items', () => {
			expect(valibotToOpenApi(v.array(v.string()), RES))
				.toStrictEqual({ type: 'array', items: { type: 'string' } });
		});

		test('min_length / max_length は array では minItems / maxItems になる', () => {
			expect(valibotToOpenApi(v.pipe(v.array(misskeyId()), v.minLength(1), v.maxLength(16), uniqueArray()), RES))
				.toStrictEqual({
					type: 'array',
					items: { type: 'string', format: 'misskey:id' },
					minItems: 1,
					maxItems: 16,
					uniqueItems: true,
				});
		});

		test('strictTuple → prefixItems + unevaluatedItems: false', () => {
			expect(valibotToOpenApi(v.strictTuple([v.string(), v.number()]), RES))
				.toStrictEqual({
					type: 'array',
					prefixItems: [{ type: 'string' }, { type: 'number' }],
					unevaluatedItems: false,
				});
		});

		test('tuple は unevaluatedItems を出さない', () => {
			expect(valibotToOpenApi(v.tuple([v.string()]), RES))
				.toStrictEqual({ type: 'array', prefixItems: [{ type: 'string' }] });
		});

		test('要素が v.any() の array は items を出さない (anyArray()) ', () => {
			expect(valibotToOpenApi(anyArray(), RES)).toStrictEqual({ type: 'array' });
			expect(valibotToOpenApi(v.array(v.any()), RES)).toStrictEqual({ type: 'array' });
		});
	});

	describe('object', () => {
		test('required は非 optional な entries から導出する (res)', () => {
			expect(valibotToOpenApi(v.object({
				a: v.string(),
				b: v.optional(v.string()),
				c: v.nullable(v.string()),
				d: v.nullish(v.string()),
			}), RES)).toStrictEqual({
				type: 'object',
				properties: {
					a: { type: 'string' },
					b: { type: 'string' },
					c: { type: ['string', 'null'] },
					d: { type: ['string', 'null'] },
				},
				// nullable は required に載る / optional・nullish は載らない
				required: ['a', 'c'],
			});
		});

		test('required は param でも導出する', () => {
			expect(valibotToOpenApi(v.object({ a: v.string(), b: v.optional(v.string()) }), PARAM).required)
				.toStrictEqual(['a']);
		});

		test('required が空なら省略する', () => {
			expect(valibotToOpenApi(v.object({ a: v.optional(v.string()) }), RES))
				.toStrictEqual({ type: 'object', properties: { a: { type: 'string' } } });
		});

		test('空 object でも properties は出す (hasBody 判定のため)', () => {
			expect(valibotToOpenApi(v.object({}), PARAM)).toStrictEqual({ type: 'object', properties: {} });
		});

		test('プロパティの出力順序は entries の挿入順を保存する', () => {
			const schema = v.object({
				...paginationEntries({ max: 100, default: 10 }),
				zzz: v.optional(v.string()),
				aaa: v.optional(v.string()),
			});
			expect(Object.keys(valibotToOpenApi(schema, PARAM).properties as object))
				.toStrictEqual(['limit', 'sinceId', 'untilId', 'zzz', 'aaa']);
		});

		test('strictObject → additionalProperties: false', () => {
			expect(valibotToOpenApi(v.strictObject({ a: v.string() }), RES))
				.toStrictEqual({
					type: 'object',
					properties: { a: { type: 'string' } },
					additionalProperties: false,
					required: ['a'],
				});
		});

		test('record → additionalProperties', () => {
			expect(valibotToOpenApi(v.record(v.string(), v.union([v.string()])), RES))
				.toStrictEqual({ type: 'object', additionalProperties: { anyOf: [{ type: 'string' }] } });
		});

		test('anyRecord() → additionalProperties: true / anyObject() → 素の object', () => {
			expect(valibotToOpenApi(anyRecord(), RES)).toStrictEqual({ type: 'object', additionalProperties: true });
			expect(valibotToOpenApi(anyObject(), RES)).toStrictEqual({ type: 'object' });
		});

		// cookbook R1: properties 無しの object / items 無しの array
		test('値が v.any() の record は additionalProperties を出さない', () => {
			expect(valibotToOpenApi(v.record(v.string(), v.any()), RES)).toStrictEqual({ type: 'object' });
			expect(valibotToOpenApi(v.objectWithRest({ a: v.string() }, v.any()), RES))
				.toStrictEqual({ type: 'object', properties: { a: { type: 'string' } }, required: ['a'] });
		});
	});

	describe('default', () => {
		test('optional + default → default 出力 + required から除外', () => {
			expect(valibotToOpenApi(v.object({ a: v.optional(v.boolean(), false) }), PARAM))
				.toStrictEqual({ type: 'object', properties: { a: { type: 'boolean', default: false } } });
		});

		test('limit() は minimum / maximum / default を出す', () => {
			expect(valibotToOpenApi(limit({ max: 100, def: 10 }), PARAM))
				.toStrictEqual({ type: 'integer', minimum: 1, maximum: 100, default: 10 });
		});

		test('nullable + default (v.optional(v.nullable(x), null))', () => {
			expect(valibotToOpenApi(v.optional(v.nullable(v.string()), null), PARAM))
				.toStrictEqual({ type: ['string', 'null'], default: null });
		});

		test('default 無しの optional は default キーを出さない', () => {
			expect(valibotToOpenApi(v.optional(v.string()), PARAM)).toStrictEqual({ type: 'string' });
			expect(valibotToOpenApi(v.nullish(v.string()), PARAM)).toStrictEqual({ type: ['string', 'null'] });
		});
	});

	describe('nullable の表現', () => {
		test('単一 type → type 配列', () => {
			expect(valibotToOpenApi(v.nullable(dateTimeString()), RES))
				.toStrictEqual({ type: ['string', 'null'], format: 'date-time' });
		});

		test('$ref → oneOf [$ref, null]', () => {
			expect(valibotToOpenApi(v.nullable(refAntennaSchema), RES))
				.toStrictEqual({ oneOf: [{ $ref: '#/components/schemas/Antenna' }, { type: 'null' }] });
		});

		test('二重 nullable でも null は 1 度だけ', () => {
			expect(valibotToOpenApi(v.nullable(v.nullable(v.string())), RES))
				.toStrictEqual({ type: ['string', 'null'] });
		});
	});

	describe('combinators', () => {
		test('union → anyOf', () => {
			expect(valibotToOpenApi(v.union([v.string(), v.number()]), RES))
				.toStrictEqual({ anyOf: [{ type: 'string' }, { type: 'number' }] });
		});

		test('asOneOf() で union を oneOf にできる', () => {
			expect(valibotToOpenApi(v.pipe(v.union([refBlockingSchema, refClipSchema]), asOneOf()), RES))
				.toStrictEqual({
					oneOf: [
						{ $ref: '#/components/schemas/Blocking' },
						{ $ref: '#/components/schemas/Clip' },
					],
				});
		});

		test('union([T, v.null()]) は type 配列に畳む', () => {
			expect(valibotToOpenApi(v.union([v.string(), v.null()]), RES)).toStrictEqual({ type: ['string', 'null'] });
			expect(valibotToOpenApi(v.union([v.string(), v.number(), v.null()]), RES))
				.toStrictEqual({ oneOf: [{ anyOf: [{ type: 'string' }, { type: 'number' }] }, { type: 'null' }] });
		});

		test('variant → type: object + oneOf', () => {
			expect(valibotToOpenApi(v.variant('type', [
				v.object({ type: v.literal('a') }),
				v.object({ type: v.literal('b') }),
			]), RES)).toStrictEqual({
				type: 'object',
				oneOf: [
					{ type: 'object', properties: { type: { type: 'string', enum: ['a'] } }, required: ['type'] },
					{ type: 'object', properties: { type: { type: 'string', enum: ['b'] } }, required: ['type'] },
				],
			});
		});

		test('intersect → allOf', () => {
			expect(valibotToOpenApi(v.intersect([v.object({ a: v.string() }), v.object({ b: v.string() })]), RES).allOf)
				.toHaveLength(2);
		});
	});

	describe('entity 参照', () => {
		const leafSchema = defineEntity('Hashtag', v.object({ tag: v.string() }));

		test('登録済みスキーマへの直接参照は $ref になる', () => {
			expect(valibotToOpenApi(v.object({ h: leafSchema }), RES).properties)
				.toStrictEqual({ h: { $ref: '#/components/schemas/Hashtag' } });
		});

		test('rootName が一致するときだけルートを展開する', () => {
			expect(valibotToOpenApi(leafSchema, { ...RES, rootName: 'Hashtag' }))
				.toStrictEqual({ type: 'object', properties: { tag: { type: 'string' } }, required: ['tag'] });
			expect(valibotToOpenApi(leafSchema, RES)).toStrictEqual({ $ref: '#/components/schemas/Hashtag' });
		});

		test('v.lazy() 経由の自己参照は $ref になる', () => {
			const noteSchema: AnyValibotSchema = defineEntity('Note', v.object({
				id: idString(),
				reply: v.optional(v.nullable(v.lazy(() => noteSchema))),
			}));

			expect(valibotToOpenApi(noteSchema, { ...RES, rootName: 'Note' })).toStrictEqual({
				type: 'object',
				properties: {
					id: { type: 'string', format: 'id' },
					reply: { oneOf: [{ $ref: '#/components/schemas/Note' }, { type: 'null' }] },
				},
				required: ['id'],
			});
		});

		test('selfRef() は includeSelfRef で分岐する', () => {
			const blockSchema: AnyValibotSchema = defineEntity('PageBlock', v.object({
				id: v.string(),
				children: v.array(v.pipe(v.lazy(() => blockSchema), selfRef())),
			}));

			expect(valibotToOpenApi(blockSchema, { use: 'res', includeSelfRef: true, rootName: 'PageBlock' }).properties)
				.toStrictEqual({
					id: { type: 'string' },
					children: { type: 'array', items: { $ref: '#/components/schemas/PageBlock' } },
				});
			expect(valibotToOpenApi(blockSchema, { use: 'res', includeSelfRef: false, rootName: 'PageBlock' }).properties)
				.toStrictEqual({
					id: { type: 'string' },
					children: { type: 'array', items: { type: 'object' } },
				});
		});

		test('composeEntity() は allOf: [$ref, ...] を出し properties を出さない', () => {
			const lite = defineEntity('UserLite', v.object({ id: idString() }));
			const detailedOnly = defineEntity('UserDetailedNotMeOnly', v.object({ isFollowing: v.optional(v.boolean()) }));
			const composed = composeEntity('UserDetailedNotMe', [lite, detailedOnly]);

			expect(valibotToOpenApi(composed, { ...RES, rootName: 'UserDetailedNotMe' })).toStrictEqual({
				type: 'object',
				allOf: [
					{ $ref: '#/components/schemas/UserLite' },
					{ $ref: '#/components/schemas/UserDetailedNotMeOnly' },
				],
			});
		});

		test('composeEntity() の未登録パートは allOf にインライン展開される', () => {
			// legacy の Role (`allOf: [{ ref: 'RoleLite' }, { inline properties }]`) と同じ混在パターン
			const lite = defineEntity('RoleLite', v.object({ id: idString() }));
			const detailedOnly = v.object({
				createdAt: dateTimeString(),
				usersCount: integer(),
				isPublic: v.optional(v.boolean()),
			});
			const composed = composeEntity('Role', [lite, detailedOnly]);

			expect(valibotToOpenApi(composed, { ...RES, rootName: 'Role' })).toStrictEqual({
				type: 'object',
				allOf: [
					{ $ref: '#/components/schemas/RoleLite' },
					{
						type: 'object',
						properties: {
							createdAt: { type: 'string', format: 'date-time' },
							usersCount: { type: 'integer' },
							isPublic: { type: 'boolean' },
						},
						required: ['createdAt', 'usersCount'],
					},
				],
			});

			// 未登録パートの entries もランタイム側 (フラットな v.object) にはマージされている
			expect(v.is(composed, { id: 'xxxxxxxxxx', createdAt: '2026-01-01T00:00:00.000Z', usersCount: 1 })).toBe(true);
		});

		test('composeEntity() は object でないパートを拒否する', () => {
			expect(() => composeEntity('RolePolicies', [v.string()])).toThrow(/is not an object schema/);
		});
	});

	describe('エスケープハッチ', () => {
		test('openApi() は生キーワードを最後にマージする', () => {
			expect(valibotToOpenApi(v.pipe(v.string(), openApi({ contentMediaType: 'image/png' })), RES))
				.toStrictEqual({ type: 'string', contentMediaType: 'image/png' });
		});

		test('omitKeywords() はキーワードを削除する', () => {
			expect(valibotToOpenApi(v.pipe(v.string(), v.regex(/^a$/), omitKeywords('pattern')), RES))
				.toStrictEqual({ type: 'string' });
		});
	});

	describe('禁止事項の検出', () => {
		test('param スキーマ内の transform は throw する', () => {
			expect(() => valibotToOpenApi(v.object({ a: v.pipe(v.string(), v.trim()) }), PARAM))
				.toThrow(/transformation action/);
		});

		test('res スキーマの transform は許容する', () => {
			expect(valibotToOpenApi(v.pipe(v.string(), v.trim()), RES)).toStrictEqual({ type: 'string' });
		});

		test('未対応のスキーマ種別は throw する', () => {
			expect(() => valibotToOpenApi(v.date(), RES)).toThrow(/unsupported schema type 'date'/);
		});

		test('Valibot スキーマでないものは throw する', () => {
			expect(() => valibotToOpenApi({ type: 'string' } as unknown as AnyValibotSchema, RES))
				.toThrow(/not a valibot schema/);
		});

		test('レジストリ未登録の循環 v.lazy() は throw する', () => {
			const loop: AnyValibotSchema = v.object({ next: v.optional(v.lazy(() => loop)) });
			expect(() => valibotToOpenApi(loop, RES)).toThrow(/circular v\.lazy/);
		});
	});

	/**
	 * 移行前の legacy コンバータ (`convertSchemaToOpenApiSchema`) が出していた形の回帰フィクスチャ。
	 *
	 * 移行中はこの 4 ケースを「legacy コンバータに同じ意味のスキーマを通した結果」と deep-equal 比較
	 * (シャドウ変換) していた。legacy コンバータを撤去した今は、その当時の出力をそのまま
	 * 期待値として直書きし、api.json の出力形が動いていないことの回帰テストとして残している。
	 */
	describe('回帰フィクスチャ (移行前の出力形)', () => {
		test('小さな object', () => {
			expect(valibotToOpenApi(v.object({
				a: v.string(),
				b: v.optional(v.nullable(v.number())),
				c: v.array(idString()),
			}), RES)).toStrictEqual({
				type: 'object',
				properties: {
					a: { type: 'string' },
					b: { type: ['number', 'null'] },
					c: { type: 'array', items: { type: 'string', format: 'id' } },
				},
				required: ['a', 'c'],
			});
		});

		test('nullable な entity 参照', () => {
			expect(valibotToOpenApi(v.nullable(refAntennaSchema), RES)).toStrictEqual({
				oneOf: [{ $ref: '#/components/schemas/Antenna' }, { type: 'null' }],
			});
		});

		test('enum + default', () => {
			expect(valibotToOpenApi(v.optional(v.picklist(['public', 'home']), 'public'), PARAM)).toStrictEqual({
				type: 'string',
				enum: ['public', 'home'],
				default: 'public',
			});
		});

		test('nullable な enum (null 込み)', () => {
			expect(valibotToOpenApi(nullableEnum(['likeOnly', null]), RES)).toStrictEqual({
				type: ['string', 'null'],
				enum: ['likeOnly', null],
			});
		});
	});
});
