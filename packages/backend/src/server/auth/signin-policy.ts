/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** サインインフローで充足しうる認証手段 */
export type AuthMethod = 'password' | 'totp' | 'passkey';

/**
 * サインインフローの一時状態。Redis (`signin:session:${signinFlowId}`) に JSON で保存し、
 * サインイン完了時に破棄する (ログイン後の `user_session` とは別物)。
 */
export type SigninSession = {
	/** スキーマ版。形を変えたら上げる (ローリングデプロイ中に古い形式を読むのを弾く) */
	v: 1;

	/** ユーザーが確定するまでは null (匿名パスキー経路では検証成功時に確定する) */
	userId: string | null;

	/** ユーザーが設定している第 2 要素。ユーザー確定前は null (Set は JSON 化できないので配列で持つ) */
	available: AuthMethod[] | null;

	/** パスキー単独でのサインイン (パスワードレスログイン) が有効か */
	passwordless: boolean;

	/** 既に充足した手段 */
	satisfied: AuthMethod[];

	createdAt: number;
};

/**
 * 充足条件の集合を導出する。返り値は OR で結ばれた AND 条件で、
 * どれか 1 つの集合が全て充足されればサインイン成立。
 */
export function policiesFor(session: SigninSession): ReadonlySet<AuthMethod>[] {
	const available = new Set(session.available ?? []);

	// パスワードレスログインは通常のポリシーを置き換えず、「パスキー単独」を追加する
	const policies: Set<AuthMethod>[] = session.passwordless ? [new Set<AuthMethod>(['passkey'])] : [];

	const secondFactors = (['totp', 'passkey'] as const).filter(m => available.has(m));
	if (secondFactors.length === 0) {
		policies.push(new Set<AuthMethod>(['password'])); // 2FA 未設定ユーザー
	} else {
		for (const m of secondFactors) policies.push(new Set<AuthMethod>(['password', m]));
	}

	return policies;
}

/** サインインが成立したか */
export function isSatisfied(session: SigninSession): boolean {
	const done = new Set(session.satisfied);
	return policiesFor(session).some(p => [...p].every(m => done.has(m)));
}

/** 次に受け付ける手段の集合。{@link toWireNext} が案内する 1 つより広い */
export function acceptableMethods(session: SigninSession): Set<AuthMethod> {
	const done = new Set(session.satisfied);
	const out = new Set<AuthMethod>();
	for (const p of policiesFor(session)) {
		if ([...p].every(m => done.has(m))) return new Set(); // 成立済みなので、これ以上は受け付けない
		for (const m of p) if (!done.has(m)) out.add(m);
	}
	return out;
}

/** ワイヤ上の next (単一値) は {@link acceptableMethods} から導出する */
export function toWireNext(ms: Set<AuthMethod>): 'password' | 'totp' | 'passkey' | 'totpOrPasskey' | null {
	if (ms.size === 0) return null;
	if (ms.has('password')) return 'password'; // パスワードは常に最優先で案内する
	if (ms.has('totp') && ms.has('passkey')) return 'totpOrPasskey';
	if (ms.has('passkey')) return 'passkey';
	if (ms.has('totp')) return 'totp';
	return null;
}
