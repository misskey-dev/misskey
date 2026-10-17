/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { marker } from '@/core/telemetry/sanitizer/validation.js';

/** sentry.op / span の op として許可する形式。DB種別やHTTP方向以上の情報を漏らさない範囲に絞り、両方の判定で共有する。 */
export const sentryOpPattern = /^(db(\.redis(\.connect)?)?|http\.(server|client)|(hook|request_handler)\.fastify)$/;

/**
 * Sentry の Fastify 計装が hook / route handler の span に付ける op。
 * combined 構成ではこの op でしか hook span を判別できないため、export 判定と表示名の検証で共有する。
 */
export const fastifyHookOps = new Set(['hook.fastify', 'request_handler.fastify']);

/** Misskey自身が発行する固定語彙 (API:/Queue: 表記)。利用者入力を含まない形式だけを許可する。 */
const misskeyVocabularyPattern = /^(API: [A-Za-z0-9_./:-]{1,128}|Queue: [A-Za-z0-9_ .:-]{1,128})$/;

/**
 * PostgreSQL の問い合わせ span 名として許可する形式。
 * export 判定と表示名の検証で共有する。
 */
export const pgQueryNamePattern = /^pg\.query(?::[A-Z][A-Z0-9_]{0,31}(?: [A-Za-z0-9_.-]{1,128})?)?$/;

/**
 * redis-<cmd> 形式のコマンド名。
 * export 判定と表示名の検証で共有する。
 */
export const redisCommandNamePattern = /^redis-[A-Za-z0-9_-]{1,128}$/;

/**
 * Fastify の hook 関連 span 名・属性に現れる識別子の連結。
 *
 * 関数名・プラグイン名・hook 名を ` - ` と ` -> ` でつないだ形だけを許可する
 * (`bound createServer -> @fastify/cors -> @fastify/multipart` など)。
 * 材料はプラグイン登録時に確定する関数名とプラグイン名だけで、リクエスト由来の値は入らない。
 */
const fastifyIdentifierChainPattern = /^(?:bound )?[A-Za-z0-9_@./-]{1,64}(?: ->? (?:bound )?[A-Za-z0-9_@./-]{1,64}){0,15}$/;

/**
 * Fastify の hook 関連の値が、識別子の連結だけでできているか確認する。
 *
 * 属性の検証と span 名の検証で共有する。
 * 長さを先に切ってから照合し、入力長に依存する探索を避ける。
 */
export function isFastifyIdentifierText(value: string): boolean {
	return value.length <= 256 && fastifyIdentifierChainPattern.test(value);
}

/**
 * 許可済みの属性から、span が Fastify の hook / route handler の計測か判定する。
 *
 * 名前の形式は計装ごとに違う (@fastify/otel は `<hook> - <handler>`、Sentry は `<plugin> - <hook>` と `request`)。
 * 名前の形だけでは判別できないため、OTel-only 構成は `fastify.type`、Sentry 併用構成は `sentry.op` で確認する。
 */
function isFastifyHookSpan(data: Record<string, string | number | boolean>): boolean {
	const fastifyType = data['fastify.type'];
	if (typeof fastifyType === 'string' && fastifyType !== marker) {
		return true;
	}
	const op = data['sentry.op'];
	return typeof op === 'string' && fastifyHookOps.has(op);
}

/** 前後の `^`/`$` アンカーを外し、他の正規表現の内部で再利用できる形にする。 */
function withoutAnchors(pattern: RegExp): string {
	return pattern.source.replace(/^\^/, '').replace(/\$$/, '');
}

/**
 * DB 計装が付与する固定の span 名。
 * 問い合わせと Redis コマンドの部分は export 判定と同じ正規表現を使い、許可する形式のずれを防ぐ。
 */
const dbInstrumentationVerbPattern = new RegExp(`^(${withoutAnchors(pgQueryNamePattern)}|pg\\.connect|pg-pool\\.connect|${withoutAnchors(redisCommandNamePattern)}|MULTI|PIPELINE)$`);

/**
 * span 名を、固定語彙または許可済みの HTTP 属性から作り直す。
 *
 * HTTP span の元の名前には生の path が含まれうるため使用しない。
 * 受信 span は method と route、送信 span は method と `url.full` の host を使う。
 * Fastify の hook span は名前もソース上の識別子だけでできているため、属性と形式を確認したうえでそのまま使う。
 * どの形式にも一致しない名前は伏せる。
 */
export function safeName(value: unknown, data: Record<string, string | number | boolean> = {}): string {
	if (typeof value === 'string' && (misskeyVocabularyPattern.test(value) || dbInstrumentationVerbPattern.test(value) || sentryOpPattern.test(value))) {
		return value;
	}
	// hook span と確認できた場合だけ、名前を識別子の連結として受け付ける。
	if (typeof value === 'string' && isFastifyHookSpan(data) && isFastifyIdentifierText(value)) {
		return value;
	}
	const method = data['http.request.method'];
	if (typeof method !== 'string') {
		return marker;
	}
	const route = data['http.route'];
	if (typeof route === 'string' && route !== marker) {
		return `${method} ${route}`;
	}
	// `url.full` がある送信 span だけ、送信先 host を名前に使う。
	// route のない受信 span を listen address でまとめないため、`server.address` では代替しない。
	const url = data['url.full'];
	if (typeof url !== 'string') {
		return marker;
	}
	// Sentry の client span は `server.address` を持たないため、構成によらず `url.full` から host を得る。
	try {
		return `${method} ${new URL(url).host}`;
	} catch {
		return marker;
	}
}
