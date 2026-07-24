/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** 監視サービスへ渡す値全体の上限。 */
const maxOutputBytes = 64 * 1024;

const text = new TextEncoder();

/** 形式検証を通らなかった値の代替文字列。 */
export const marker = '[redacted]';

/**
 * 追跡単位の識別子が、有効な 32 桁の 16 進数か確認する。
 *
 * すべて 0 の予約値は実際の識別子として使えないため除外する。
 */
export function isTraceId(value: unknown): value is string {
	return typeof value === 'string' && /^[a-f0-9]{32}$/i.test(value) && !/^0{32}$/.test(value);
}

/**
 * 計測単位の識別子が、有効な 16 桁の 16 進数か確認する。
 *
 * すべて 0 の予約値は実際の識別子として使えないため除外する。
 */
export function isSpanId(value: unknown): value is string {
	return typeof value === 'string' && /^[a-f0-9]{16}$/i.test(value) && !/^0{16}$/.test(value);
}

/**
 * 監視サービスへ渡す情報が、定めた大きさの上限内か確認する。
 *
 * 呼び出し側が上限の実装を意識しなくてよいよう、共通処理を公開する。
 */
export function isWithinObservabilityLimit(value: unknown): boolean {
	try {
		return text.encode(JSON.stringify(value)).byteLength <= maxOutputBytes;
	} catch {
		// 直列化できない値も安全側に倒して、送信を許可しない。
		return false;
	}
}
