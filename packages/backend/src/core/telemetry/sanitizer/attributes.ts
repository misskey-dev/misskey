/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { stripLogInjectionControlChars, truncateUtf8Bytes } from '@/core/telemetry/sanitizer/text.js';
import { isWithinObservabilityLimit, marker } from '@/core/telemetry/sanitizer/validation.js';

/**
 * span から監視サービスへの出力を許可する属性名。
 *
 * 未知の属性は利用者情報を含む可能性があるため fail-closed で破棄する。
 * 計装ライブラリの更新で属性が増えても、ここへ追加するまでは出力されない。
 * SQL 本文はこの一覧へ含めず、明示的な許可と PostgreSQL の確認を通る別経路でだけ扱う。
 */
const allowedAttributeKeys = new Set([
	'http.request.method',
	'http.response.status_code',
	'http.route',
	'url.full',
	'server.address',
	'server.port',
	'network.protocol.version',
	'error.type',
	'db.system.name',
	'db.namespace',
	'db.operation.name',
	'db.response.status_code',
	'fastify.type',
	'hook.name',
	'hook.callback.name',
]);

/**
 * 数値のまま通す属性。
 *
 * ほかの属性は文字列として検証し、型による検証の迂回を防ぐ。
 */
const numericAttributeKeys = new Set(['http.response.status_code', 'server.port', 'db.response.status_code']);

/** 短い識別子 (英数字と決めた記号) の文字列として通す属性。 */
const tokenAttributeKeys = new Set([
	'http.request.method',
	'network.protocol.version',
	'error.type',
	'db.system.name',
	'db.namespace',
	'db.operation.name',
	'db.response.status_code',
]);

/**
 * 明示的な許可がある場合に限り通す SQL 本文の属性名。
 *
 * Redis 計装も `db.query.text` を使うため、PostgreSQL の属性であることも確認する。
 */
const dbStatementAttributeKeys = new Set(['db.statement', 'db.query.text']);

/** db.statement / db.query.text を許可する上限バイト数 (UTF-8)。 */
const dbStatementMaxBytes = 8 * 1024;

/** @fastify/otel が fastify.type に設定する固定語彙。 */
const fastifyTypeValues = new Set(['route-hook', 'hook', 'request-handler']);

/**
 * Fastify の hook 関連属性に現れる識別子の連結。
 *
 * 関数名・プラグイン名・hook 名を ` - ` と ` -> ` でつないだ形だけを許可する
 * (`bound createServer -> @fastify/cors -> @fastify/multipart` など)。
 * 材料はプラグイン登録時に確定する関数名とプラグイン名だけで、リクエスト由来の値は入らない。
 */
const fastifyIdentifierChainPattern = /^(?:bound )?[A-Za-z0-9_@./-]{1,64}(?: ->? (?:bound )?[A-Za-z0-9_@./-]{1,64}){0,15}$/;

export type SanitizeAttributesOptions = {
	/**
	 * PostgreSQL span の `db.statement` と `db.query.text` を OTLP に含める。
	 *
	 * Redis の同名属性を通さないよう、`db.system.name` が PostgreSQL であることも要求する。
	 */
	allowDbStatement?: boolean;
};

/**
 * 外部へ送る URL を、接続先の始点だけにする。
 *
 * 経路や問い合わせ文字列には利用者ごとの情報 (Push endpoint や Webhook の capability URL など) が含まれうるため残さない。
 */
function sanitizeOutboundUrl(value: string): string | undefined {
	try {
		const url = new URL(value);
		return url.origin === 'null' ? undefined : url.origin;
	} catch {
		return undefined;
	}
}

/**
 * 監視用に許可した属性だけを、値ごとに安全な形式へ変換して返す。
 *
 * 未知の属性は利用者情報を含む可能性があるため、外部へ渡さない。
 * SQL 本文は `allowDbStatement` が有効な PostgreSQL span に限って許可する。
 */
export function sanitizeAttributes(value: unknown, options?: SanitizeAttributesOptions): Record<string, string | number | boolean> {
	const output: Record<string, string | number | boolean> = {};
	try {
		if (value == null || typeof value !== 'object') {
			return output;
		}

		// Redis の同名属性を通さないよう、SQL 本文の許可を属性集合全体から先に判定する。
		const isPostgresStatement = options?.allowDbStatement === true && Reflect.get(value, 'db.system.name') === 'postgresql';

		for (const key of Object.keys(value)) {
			const allowedAsDbStatement = isPostgresStatement && dbStatementAttributeKeys.has(key);
			if (!allowedAttributeKeys.has(key) && !allowedAsDbStatement) {
				continue;
			}
			const safe = sanitizeAttribute(key, Reflect.get(value, key), allowedAsDbStatement);
			if (safe != null) {
				output[key] = safe;
			}
		}
	} catch {
		// 読み取り中に失敗した場合も、部分的な値を返さない。
		return {};
	}

	// 属性ごとに安全でも、合計が上限を超える場合は全体を出力しない。
	return isWithinObservabilityLimit(output) ? output : {};
}

/**
 * 属性名に応じて、値を公開可能な形式へ変換する。
 *
 * 形式を確認できない文字列は伏せ、任意の文字列をそのまま通さない。
 */
function sanitizeAttribute(key: string, value: unknown, allowedAsDbStatement: boolean): string | number | boolean | undefined {
	// 数値は専用の属性だけに許可し、文字列向けの検証を迂回させない。
	// 非有限数は JSON 化で null になり、上限判定時の値と実際の出力が食い違うため通さない。
	if (typeof value === 'number') {
		return numericAttributeKeys.has(key) && Number.isFinite(value) ? value : undefined;
	}
	if (typeof value !== 'string') {
		return undefined;
	}

	// SQL 本文は、明示的に許可された場合だけ制御文字と長さを制限して通す。
	if (allowedAsDbStatement) {
		return truncateUtf8Bytes(stripLogInjectionControlChars(value), dbStatementMaxBytes);
	}

	// URL と経路は値そのものを残さず、用途に合わせて必要最小限にする。
	if (key === 'url.full') {
		return sanitizeOutboundUrl(value);
	}
	if (key === 'http.route') {
		return sanitizeRoute(value);
	}

	// 接続先や内部の識別子は、決めた文字種と長さだけを許可する。
	if (key === 'server.address') {
		return /^[A-Za-z0-9.:[\]-]{1,253}$/.test(value) ? value : marker;
	}
	// Fastify の hook span は、プラグイン登録時に確定する関数名・プラグイン名だけを持つ。
	// 値はリクエスト由来ではないが、想定外の source が混ざった場合に備えて形式を確認する。
	if (key === 'fastify.type') {
		return fastifyTypeValues.has(value) ? value : marker;
	}
	if (key === 'hook.name' || key === 'hook.callback.name') {
		return value.length <= 256 && fastifyIdentifierChainPattern.test(value) ? value : marker;
	}
	// db.response.status_code は数値とは限らない。semconv 1.43 の例は '08P01' / 'ORA-17002' で、
	// Misskey 自身の Redis 計装 (redis-instrumentation.ts の getRedisErrorStatusCode) も 'ERR' 等の
	// 文字列を設定する。数値 (numericAttributeKeys) と文字列の両方を許可する。
	if (tokenAttributeKeys.has(key)) {
		return asciiToken(value);
	}
	return undefined;
}

/**
 * route template として妥当な形式だけを残す。
 *
 * 値は Fastify の route table 由来 (routeOptions.url) なので利用者入力を含まないが、
 * 想定外の source が raw path を入れてきた場合に備えて形式だけ確認する。
 */
function sanitizeRoute(value: string): string {
	if (!value.startsWith('/') || value.length > 256) {
		return marker;
	}
	// fragment や制御文字を含む値は route template ではない。
	if (/[^\x20-\x7e]/.test(value) || value.includes('#')) {
		return marker;
	}
	// Fastify の任意パラメータ ('/:name?') は末尾に '?' を置く記法なので、末尾以外の '?' だけを query 付き raw path とみなす。
	const queryIndex = value.indexOf('?');
	return queryIndex === -1 || queryIndex === value.length - 1 ? value : marker;
}

/**
 * 英数字と決めた記号だけからなる短い識別子を残す。
 *
 * 自由形式の文字列を属性として公開しないための共通の確認処理である。
 */
function asciiToken(value: string): string {
	return /^[A-Za-z0-9._:-]{1,256}$/.test(value) ? value : marker;
}
