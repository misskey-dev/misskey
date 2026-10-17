/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isFastifyIdentifierText, sentryOpPattern } from '@/core/telemetry/sanitizer/span-name.js';
import { stripLogInjectionControlChars, truncateUtf8Bytes } from '@/core/telemetry/sanitizer/text.js';
import { isWithinObservabilityLimit, marker } from '@/core/telemetry/sanitizer/validation.js';

/**
 * 旧 semconv の属性名から、許可一覧が持つ現行名への対応。
 *
 * Sentry の受信 HTTP span が使う `http.method` と `http.flavor`、PostgreSQL 計装が使う `db.name` を正規化する。
 * これがないと combined 構成の受信 span は method を失い、route が残っていても表示名を組み立てられず `[redacted]` になる。
 */
const legacyAttributeKeyAliases = new Map([
	['http.method', 'http.request.method'],
	['db.name', 'db.namespace'],
	['http.flavor', 'network.protocol.version'],
]);

/**
 * span から監視サービスへの出力を許可する属性名。
 *
 * 未知の属性は利用者情報を含む可能性があるため fail-closed で破棄する。
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
	'db.system',
	'db.system.name',
	'db.namespace',
	'db.operation',
	'db.operation.name',
	'db.response.status_code',
	'sentry.op',
	'sentry.origin',
	'fastify.type',
	'hook.name',
	'hook.callback.name',
	'misskey.process.role',
	'service.name',
	'service.version',
	'service.instance.id',
]);

// `net.peer.*` は server span では接続元を表すため、送信先属性へ正規化しない。

/**
 * 数値のまま通す属性。
 *
 * ほかの属性は文字列として検証し、型による検証の迂回を防ぐ。
 */
const numericAttributeKeys = new Set(['http.response.status_code', 'server.port', 'db.response.status_code']);

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

export type SanitizeAttributesOptions = {
	/**
	 * PostgreSQL span の `db.statement` と `db.query.text` を OTLP に含める。
	 *
	 * この設定は OTLP 経路の `SanitizingSpanProcessor` だけが参照する。
	 * Sentry 自身が収集・送信する内容は、Sentry の計装と運用者の設定に委ねる。
	 * Redis の同名属性を通さないよう、`db.system(.name)` が PostgreSQL であることも要求する。
	 */
	allowDbStatement?: boolean;

	/**
	 * otelForBackend.resourceAttributes で operator が宣言した resource 属性のキー名。
	 * 起動時に決まる属性だけ、resource の許可一覧へ追加する。
	 */
	allowedResourceKeys?: ReadonlySet<string>;
};

/**
 * resource 属性のキーが、専用の許可一覧に含まれるか確認する。
 * 運用者が宣言したキー以外のホスト情報は許可しない。
 */
function isAllowedResourceAttributeKey(key: string, policy: SanitizeAttributesOptions): boolean {
	return key === 'misskey.process.role'
		|| key.startsWith('service.')
		|| key.startsWith('telemetry.sdk.')
		|| key.startsWith('process.runtime.')
		|| (policy.allowedResourceKeys?.has(key) ?? false);
}

/**
 * resource 専用の許可一覧と値の形式に従って属性を残す。
 * リクエスト由来の span 属性とは分けて扱う。
 */
export function sanitizeResourceAttributes(value: unknown, policy: SanitizeAttributesOptions = {}): Record<string, string | number | boolean> {
	const output: Record<string, string | number | boolean> = {};
	try {
		if (value == null || typeof value !== 'object') {
			return output;
		}

		for (const key of Object.keys(value)) {
			if (!isAllowedResourceAttributeKey(key, policy)) {
				continue;
			}
			const raw = Reflect.get(value, key);
			// JSON 化で値が変わる非有限数は通さない。
			if (typeof raw === 'number') {
				if (Number.isFinite(raw)) {
					output[key] = raw;
				}
			} else if (typeof raw === 'boolean') {
				output[key] = raw;
			} else if (typeof raw === 'string') {
				output[key] = asciiToken(raw);
			}
		}
	} catch {
		// 読み取り中に失敗した場合も、部分的な値を返さない。
		return {};
	}

	return isWithinObservabilityLimit(output) ? output : {};
}

/**
 * 外部へ送る URL を、接続先の始点だけにする。
 *
 * 経路や問い合わせ文字列には利用者ごとの情報が含まれうるため残さない。
 */
function sanitizeOutboundUrl(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}
	try {
		const url = new URL(value);
		return url.origin === 'null' ? undefined : url.origin;
	} catch {
		return undefined;
	}
}

/**
 * db.system と db.system.name が、存在する場合はどちらも 'postgresql' であることを確認する。
 * 相反する属性の組み合わせで SQL 本文が許可されないよう、少なくとも一方の存在と両者の一致を求める。
 */
function isAgreeingPostgresSystem(value: object): boolean {
	const system = Reflect.get(value, 'db.system');
	const systemName = Reflect.get(value, 'db.system.name');
	const systemAgrees = system === undefined || system === 'postgresql';
	const systemNameAgrees = systemName === undefined || systemName === 'postgresql';
	return systemAgrees && systemNameAgrees && (system !== undefined || systemName !== undefined);
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
		const isPostgresStatement = options?.allowDbStatement === true && isAgreeingPostgresSystem(value);

		for (const key of Object.keys(value)) {
			// 旧名は現行名へ寄せてから判定する。現行名が同じ属性集合に存在する場合は、そちらを優先して旧名を捨てる。
			const canonicalKey = legacyAttributeKeyAliases.get(key) ?? key;
			if (canonicalKey !== key && Object.hasOwn(value, canonicalKey)) {
				continue;
			}
			const allowedAsDbStatement = isPostgresStatement && dbStatementAttributeKeys.has(canonicalKey);
			if (!allowedAttributeKeys.has(canonicalKey) && !allowedAsDbStatement) {
				continue;
			}
			const raw = Reflect.get(value, key);
			const safe = sanitizeAttribute(canonicalKey, raw, allowedAsDbStatement);
			if (safe != null) {
				output[canonicalKey] = safe;
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
function sanitizeAttribute(key: string, value: unknown, allowedAsDbStatement = false): string | number | boolean | undefined {
	// 数値は専用の属性だけに許可し、文字列向けの検証を迂回させない。
	// 非有限数は JSON 化で null になり、上限判定時の値と実際の出力が食い違うため通さない。
	if (typeof value === 'number') {
		return numericAttributeKeys.has(key) && Number.isFinite(value) ? value : undefined;
	}
	if (typeof value !== 'string') {
		return undefined;
	}

	// SQL 本文は、明示的に許可された場合だけ制御文字と長さを制限して通す。
	if (allowedAsDbStatement && (key === 'db.statement' || key === 'db.query.text')) {
		return truncateDbStatement(value);
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
	if (key === 'sentry.origin') {
		// auto.http.otel.node_fetch は native fetch() の送信 span (undici 計装)。
		// auto.http.otel.fastify は Sentry の Fastify 計装が作る hook / route handler span。
		return /^(auto\.db\.otel\.postgres|auto\.db\.redis\.diagnostic_channel|auto\.http\.(otel\.(http|node_fetch|fastify)|client))$/.test(value) ? value : marker;
	}
	if (key === 'sentry.op') {
		return sentryOpPattern.test(value) ? value : marker;
	}
	// Fastify の hook span は、プラグイン登録時に確定する関数名・プラグイン名だけを持つ。
	// 値はリクエスト由来ではないが、想定外の source が混ざった場合に備えて形式を確認する。
	if (key === 'fastify.type') {
		return fastifyTypeValues.has(value) ? value : marker;
	}
	if (key === 'hook.name' || key === 'hook.callback.name') {
		return isFastifyIdentifierText(value) ? value : marker;
	}
	// db.response.status_code は数値とは限らない。semconv 1.43 の例は '08P01' / 'ORA-17002' で、
	// Misskey 自身の Redis 計装 (redis-instrumentation.ts の getRedisErrorStatusCode) も 'ERR' 等の
	// 文字列を設定する。数値 (numericAttributeKeys) と文字列の両方を許可する。
	if (key === 'db.system' || key === 'db.system.name' || key === 'db.namespace' || key === 'db.operation' || key === 'db.operation.name' || key === 'db.response.status_code' || key === 'error.type' || key === 'http.request.method' || key === 'network.protocol.version' || key.startsWith('service.') || key === 'misskey.process.role') {
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

/**
 * capturePgStatement で明示許可された SQL 本文を、送信前に加工する。
 *
 * 制御文字除去後にUTF-8バイト数で上限を切る。
 */
function truncateDbStatement(value: string): string {
	return truncateUtf8Bytes(stripLogInjectionControlChars(value), dbStatementMaxBytes);
}
