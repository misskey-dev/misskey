/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { acceptableMethods, isSatisfied, policiesFor, toWireNext } from '@/server/auth/signin-policy.js';
import type { AuthMethod, SigninSession } from '@/server/auth/signin-policy.js';

function session(params: Partial<SigninSession> = {}): SigninSession {
	return {
		v: 1,
		userId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		available: [],
		passwordless: false,
		satisfied: [],
		createdAt: 0,
		...params,
	};
}

/** ポリシーの集合を、比較しやすいようソート済みの配列の配列にする */
function policies(s: SigninSession): AuthMethod[][] {
	return policiesFor(s).map(p => [...p].sort());
}

/** サーバーがワイヤ上で案内する 1 つ (SigninApiService と同じ導出) */
function next(s: SigninSession) {
	return toWireNext(acceptableMethods(s));
}

function methods(s: SigninSession): AuthMethod[] {
	return [...acceptableMethods(s)].sort();
}

describe('signin-policy', () => {
	describe('2FA を設定していないユーザー', () => {
		const available: AuthMethod[] = [];

		test('パスワードだけを案内する', () => {
			const s = session({ available });
			expect(policies(s)).toStrictEqual([['password']]);
			expect(isSatisfied(s)).toBe(false);
			expect(next(s)).toBe('password');
		});

		test('パスワードだけで成立する', () => {
			const s = session({ available, satisfied: ['password'] });
			expect(isSatisfied(s)).toBe(true);
			expect(next(s)).toBe(null);
		});
	});

	describe('TOTP だけを設定しているユーザー', () => {
		const available: AuthMethod[] = ['totp'];

		test('まずパスワードを案内する', () => {
			const s = session({ available });
			expect(policies(s)).toStrictEqual([['password', 'totp']]);
			expect(isSatisfied(s)).toBe(false);
			expect(next(s)).toBe('password');
		});

		test('パスワードの次に TOTP を案内する', () => {
			const s = session({ available, satisfied: ['password'] });
			expect(isSatisfied(s)).toBe(false);
			expect(next(s)).toBe('totp');
		});

		test('パスワードと TOTP で成立する', () => {
			const s = session({ available, satisfied: ['password', 'totp'] });
			expect(isSatisfied(s)).toBe(true);
			expect(next(s)).toBe(null);
		});

		test('パスワードだけでは成立しない', () => {
			expect(isSatisfied(session({ available, satisfied: ['password'] }))).toBe(false);
		});
	});

	describe('パスキーだけを設定しているユーザー', () => {
		const available: AuthMethod[] = ['passkey'];

		test('まずパスワードを案内する', () => {
			const s = session({ available });
			expect(policies(s)).toStrictEqual([['passkey', 'password']]);
			expect(isSatisfied(s)).toBe(false);
			expect(next(s)).toBe('password');
		});

		test('パスワードの次にパスキーを案内する', () => {
			const s = session({ available, satisfied: ['password'] });
			expect(isSatisfied(s)).toBe(false);
			expect(next(s)).toBe('passkey');
		});

		test('パスワードとパスキーで成立する', () => {
			const s = session({ available, satisfied: ['password', 'passkey'] });
			expect(isSatisfied(s)).toBe(true);
			expect(next(s)).toBe(null);
		});

		test('パスワードレスログインが無効なので、パスキーだけでは成立しない', () => {
			expect(isSatisfied(session({ available, satisfied: ['passkey'] }))).toBe(false);
		});
	});

	describe('TOTP とパスキーの両方を設定しているユーザー', () => {
		const available: AuthMethod[] = ['totp', 'passkey'];

		test('まずパスワードを案内する', () => {
			const s = session({ available });
			expect(policies(s)).toStrictEqual([['password', 'totp'], ['passkey', 'password']]);
			expect(isSatisfied(s)).toBe(false);
			expect(next(s)).toBe('password');
		});

		test('パスワードの次は TOTP でもパスキーでも成立する', () => {
			const afterPassword = session({ available, satisfied: ['password'] });
			expect(isSatisfied(afterPassword)).toBe(false);
			expect(next(afterPassword)).toBe('totpOrPasskey');

			expect(isSatisfied(session({ available, satisfied: ['password', 'totp'] }))).toBe(true);
			expect(isSatisfied(session({ available, satisfied: ['password', 'passkey'] }))).toBe(true);
		});

		// 受理する集合 (acceptableMethods) と、案内する 1 つ (toWireNext) は別物
		test('受理する集合は 2 つあるが、案内するのは 1 つに畳んだ値', () => {
			const s = session({ available, satisfied: ['password'] });
			expect(methods(s)).toStrictEqual(['passkey', 'totp']);
			expect(toWireNext(acceptableMethods(s))).toBe('totpOrPasskey');
		});
	});

	describe('パスワードレスログインを有効にしているユーザー', () => {
		const available: AuthMethod[] = ['passkey'];

		test('パスキーだけで成立する', () => {
			const s = session({ available, passwordless: true, satisfied: ['passkey'] });
			expect(isSatisfied(s)).toBe(true);
			expect(next(s)).toBe(null);
		});

		test('パスキー単独のポリシーは追加であって置き換えではないので、パスワード経由でも成立する', () => {
			const s = session({ available, passwordless: true });
			expect(policies(s)).toStrictEqual([['passkey'], ['passkey', 'password']]);
			expect(isSatisfied(session({ available, passwordless: true, satisfied: ['password', 'passkey'] }))).toBe(true);
			// パスキーも受理するが、案内はパスワード
			expect(methods(s)).toStrictEqual(['passkey', 'password']);
			expect(next(s)).toBe('password');
		});

		test('TOTP も設定していてもパスキーだけで成立する', () => {
			const s = session({ available: ['totp', 'passkey'], passwordless: true, satisfied: ['passkey'] });
			expect(isSatisfied(s)).toBe(true);
			expect(next(s)).toBe(null);
		});
	});

	describe('ユーザーが確定する前のセッション', () => {
		test('available が null でもパスワードを案内する', () => {
			const s = session({ userId: null, available: null });
			expect(policies(s)).toStrictEqual([['password']]);
			expect(isSatisfied(s)).toBe(false);
			expect(next(s)).toBe('password');
		});
	});

	describe('acceptableMethods', () => {
		test('成立済みのセッションでは何も受け付けない', () => {
			expect(methods(session({ available: ['totp'], satisfied: ['password', 'totp'] }))).toStrictEqual([]);
		});

		test('既に充足した手段は再度要求しない', () => {
			// パスキーが先に充足していても、パスワードレスが無効なら残りのパスワードだけを求める
			expect(methods(session({ available: ['passkey'], satisfied: ['passkey'] }))).toStrictEqual(['password']);
		});
	});

	describe('toWireNext', () => {
		test('空集合は null', () => {
			expect(toWireNext(new Set())).toBe(null);
		});

		test('パスワードは常に最優先で案内する', () => {
			expect(toWireNext(new Set<AuthMethod>(['password']))).toBe('password');
			expect(toWireNext(new Set<AuthMethod>(['password', 'totp']))).toBe('password');
			expect(toWireNext(new Set<AuthMethod>(['password', 'passkey']))).toBe('password');
			expect(toWireNext(new Set<AuthMethod>(['password', 'totp', 'passkey']))).toBe('password');
		});

		test('第 2 要素だけが残っているとき', () => {
			expect(toWireNext(new Set<AuthMethod>(['totp']))).toBe('totp');
			expect(toWireNext(new Set<AuthMethod>(['passkey']))).toBe('passkey');
			expect(toWireNext(new Set<AuthMethod>(['totp', 'passkey']))).toBe('totpOrPasskey');
		});
	});
});
