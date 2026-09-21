/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { integer, limit, misskeyId } from '@/misc/schema/index.js';

/**
 * endpoint 機構 (endpoint-base / endpoints / ApiCallService / openapi) の
 * 型レベル + ランタイムの最小テスト。
 *
 * DB には一切依存しない (Endpoint のサブクラスを直接 new して `exec()` を叩くだけ)。
 */

// 型が厳密に一致することを確認するためのヘルパー
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

function assertType<T extends true>(_ok?: T): void { /* 型が合わなければコンパイルエラーになる */ }

const user = null as never;
const token = null;

describe('endpoint: paramDef の検証と型導出', () => {
	const meta = {
		requireCredential: false,
		res: v.object({
			id: misskeyId(),
			count: integer(),
		}),
	} as const;

	const paramDef = v.object({
		id: misskeyId(),
		limit: limit({ max: 100, def: 10 }),
		text: v.optional(v.string()),
	});

	// ハンドラが受け取る型は v.InferOutput (default 付きキーは必須) になる
	assertType<Equals<v.InferOutput<typeof paramDef>, { id: string, limit: number, text?: string | undefined }>>();

	class ValibotEndpoint extends Endpoint<typeof meta, typeof paramDef> {
		constructor() {
			super(meta, paramDef, async (ps) => {
				// ps は v.InferOutput<typeof paramDef> として推論される
				assertType<Equals<typeof ps, v.InferOutput<typeof paramDef>>>();
				return { id: ps.id, count: ps.limit };
			});
		}
	}

	test('default が適用され、入力オブジェクトは書き換えられない', async () => {
		const ep = new ValibotEndpoint();
		const params = { id: 'abc123' };

		await expect(ep.exec(params, user, token)).resolves.toStrictEqual({ id: 'abc123', count: 10 });
		// Valibot は新しいオブジェクトを返すので、渡した params 自体は汚れない
		expect(params).toStrictEqual({ id: 'abc123' });
	});

	test('検証失敗時は INVALID_PARAM (dot-path 付き) で reject する', async () => {
		const ep = new ValibotEndpoint();

		const err = await ep.exec({ id: 'abc123', limit: 1000 }, user, token).catch((e: unknown) => e);
		expect(err).toBeInstanceOf(ApiError);
		expect((err as ApiError).code).toBe('INVALID_PARAM');
		expect((err as ApiError).id).toBe('3d81ceae-475f-4600-b2a8-2bc116157532');
		expect((err as ApiError).info.param).toBe('limit');
		expect((err as ApiError).info.details).toHaveLength(1);
	});
});
