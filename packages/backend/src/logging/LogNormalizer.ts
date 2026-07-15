/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Buffer } from 'node:buffer';
import type { LogAttributeValue, LogAttributes, SerializedError } from './types.js';

/** 正規化の粒度を表します。詳細指定でも秘匿処理は常に有効です。 */
export type LogNormalizationProfile = 'standard' | 'detailed';

/** 正規化で使う上限値です。 */
export type LogNormalizationLimits = {
	readonly maxDepth: number;
	readonly maxEntries: number;
	readonly maxStringBytes: number;
	readonly maxBytes: number;
};

/** 属性のキーを秘匿すべきか判定する関数です。 */
export type LogRedactor = (path: readonly string[], key: string) => boolean;

/** 正規化処理へ渡す設定です。 */
export type LogNormalizationOptions = {
	readonly profile?: LogNormalizationProfile;
	readonly limits?: Partial<LogNormalizationLimits>;
	readonly redactor?: LogRedactor;
};

/** 通常運用でログが肥大化しないようにした上限です。 */
export const STANDARD_LOG_NORMALIZATION_LIMITS: LogNormalizationLimits = {
	maxDepth: 6,
	maxEntries: 100,
	maxStringBytes: 8 * 1024,
	maxBytes: 64 * 1024,
};

/** 障害調査時により多くの情報を残す上限です。 */
export const DETAILED_LOG_NORMALIZATION_LIMITS: LogNormalizationLimits = {
	maxDepth: 10,
	maxEntries: 1000,
	maxStringBytes: 64 * 1024,
	maxBytes: 256 * 1024,
};

const REDACTED = '[REDACTED]';
const CIRCULAR = '[Circular]';
const TRUNCATED = '[Truncated]';
const UNSUPPORTED = '[Unsupported]';
const TRUNCATED_KEY = '[Truncated]';

const sensitiveKeyParts = [
	'password',
	'passwd',
	'passphrase',
	'token',
	'secret',
	'authorization',
	'cookie',
	'apikey',
	'privatekey',
	'credential',
	'hcaptcharesponse',
	'grecaptcharesponse',
	'turnstileresponse',
	'mcaptcharesponse',
	'testcaptcharesponse',
];

/** キー名を比較用に揃え、区切り文字による表記揺れを吸収します。 */
function normalizeKey(key: string): string {
	return key.toLowerCase().replace(/[-_.\s]/g, '');
}

/** 既定の秘匿対象を判定します。Misskey APIの`i`も認証情報として扱います。 */
export function defaultLogRedactor(_path: readonly string[], key: string): boolean {
	const normalized = normalizeKey(key);
	return normalized === 'i' || sensitiveKeyParts.some(part => normalized.includes(part));
}

/** 選択した方式と個別指定を合わせて、実際の上限値を決めます。 */
export function resolveLogNormalizationLimits(options: LogNormalizationOptions = {}): LogNormalizationLimits {
	const base = options.profile === 'detailed'
		? DETAILED_LOG_NORMALIZATION_LIMITS
		: STANDARD_LOG_NORMALIZATION_LIMITS;
	const limits = {
		...base,
		...options.limits,
	};
	return {
		maxDepth: Math.max(0, limits.maxDepth),
		maxEntries: Math.max(0, limits.maxEntries),
		maxStringBytes: Math.max(1, limits.maxStringBytes),
		maxBytes: Math.max(2, limits.maxBytes),
	};
}

/** 値が通常のオブジェクトとして読めるか判定します。 */
function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

/** 外部入力のキーを安全に格納するため、prototypeを持たない属性領域を作成します。 */
function createAttributeMap(): Record<string, LogAttributeValue> {
	return Object.create(null) as Record<string, LogAttributeValue>;
}

/** 値を文字列化し、文字列化処理自体の例外もログ処理へ漏らさないようにします。 */
function stringifySafely(value: unknown): string {
	try {
		return String(value);
	} catch {
		return UNSUPPORTED;
	}
}

/** UTF-8のバイト数を測ります。ログの上限を文字数ではなく出力サイズで揃えるために使います。 */
function byteLength(value: string): number {
	return Buffer.byteLength(value, 'utf8');
}

/** 文字列をUTF-8の上限内へ切り詰めます。 */
function normalizeString(value: string, maxBytes: number): string {
	if (byteLength(value) <= maxBytes) return value;
	const suffix = `…${TRUNCATED}`;
	if (byteLength(suffix) > maxBytes) {
		const end = findMaxPrefixLength(value, '', maxBytes);
		return value.slice(0, end);
	}
	const end = findMaxPrefixLength(value, suffix, maxBytes);
	return value.slice(0, end) + suffix;
}

/** 指定した後置文字列を含めて上限に収まる接頭辞の長さを二分探索します。 */
function findMaxPrefixLength(value: string, suffix: string, maxBytes: number): number {
	let lower = 0;
	let upper = value.length;
	while (lower < upper) {
		const middle = Math.ceil((lower + upper) / 2);
		if (byteLength(value.slice(0, middle) + suffix) <= maxBytes) {
			lower = middle;
		} else {
			upper = middle - 1;
		}
	}
	// UTF-16のサロゲート対を途中で切らないよう、必要なら1文字戻します。
	if (lower > 0 && lower < value.length) {
		const code = value.charCodeAt(lower - 1);
		if (code >= 0xd800 && code <= 0xdbff) lower--;
	}
	return lower;
}

/** 特殊な値に対しても、エラー判定で例外を発生させないようにします。 */
function isErrorValue(value: unknown): value is Error {
	try {
		return value instanceof Error;
	} catch {
		return false;
	}
}

/** 値の読み出しを安全に行い、壊れたログ属性が本処理を中断しないようにします。 */
function readProperty(value: Record<string, unknown>, key: string): unknown {
	try {
		return value[key];
	} catch {
		return `${UNSUPPORTED}: property access failed`;
	}
}

/** 属性をJSONへ出力できる値へ変換します。 */
function normalizeValue(
	value: unknown,
	path: readonly string[],
	depth: number,
	seen: WeakSet<object>,
	limits: LogNormalizationLimits,
	redactor: LogRedactor,
): LogAttributeValue {
	if (value === null) return null;
	if (typeof value === 'string') return normalizeString(value, limits.maxStringBytes);
	if (typeof value === 'boolean') return value;
	if (typeof value === 'number') return Number.isFinite(value) ? value : stringifySafely(value);
	if (typeof value === 'bigint') return value.toString(10);
	if (typeof value === 'undefined') return `${UNSUPPORTED}: undefined`;
	if (typeof value === 'function' || typeof value === 'symbol') return `${UNSUPPORTED}: ${typeof value}`;
	let isArray = false;
	try {
		if (value instanceof Date) {
			return normalizeString(value.toISOString(), limits.maxStringBytes);
		}
		isArray = Array.isArray(value);
		if (!isArray) {
			const prototype = Object.getPrototypeOf(value);
			if (prototype !== Object.prototype && prototype !== null) return `${UNSUPPORTED}: object`;
		}
	} catch {
		return `${UNSUPPORTED}: object access failed`;
	}
	if (seen.has(value)) return CIRCULAR;
	if (depth >= limits.maxDepth) return TRUNCATED;
	seen.add(value);

	try {
		if (isArray) {
			const arrayValue = value as readonly unknown[];
			const result: LogAttributeValue[] = [];
			const entries = Math.min(arrayValue.length, limits.maxEntries);
			for (let i = 0; i < entries; i++) {
				result.push(normalizeValue(arrayValue[i], [...path, String(i)], depth + 1, seen, limits, redactor));
			}
			if (arrayValue.length > entries) result.push(TRUNCATED);
			return result;
		}

		// 攻撃者が指定した`__proto__`を通常の属性として保持するため、null prototypeを使います。
		const result = createAttributeMap();
		const keys = Object.keys(value).sort();
		const entries = Math.min(keys.length, limits.maxEntries);
		for (let i = 0; i < entries; i++) {
			const key = keys[i];
			// 秘匿対象は値を読み出す前に置き換え、読み出し処理や巨大な値にも触れません。
			result[key] = redactor(path, key)
				? REDACTED
				: normalizeValue(readProperty(value as Record<string, unknown>, key), [...path, key], depth + 1, seen, limits, redactor);
		}
		if (keys.length > entries) result[TRUNCATED_KEY] = TRUNCATED;
		return result;
	} catch {
		return `${UNSUPPORTED}: object access failed`;
	} finally {
		seen.delete(value);
	}
}

/** JSON文字列化した値のバイト数を測ります。正規化後の最終上限に使います。 */
function serializedByteLength(value: LogAttributeValue): number {
	return byteLength(JSON.stringify(value));
}

/** 正規化済みの値を上限内へ再帰的に縮めます。 */
function trimToByteLimit(value: LogAttributeValue, maxBytes: number): LogAttributeValue {
	if (serializedByteLength(value) <= maxBytes) return value;
	if (typeof value === 'string') return normalizeString(value, maxBytes);
	if (Array.isArray(value)) {
		const result: LogAttributeValue[] = [];
		for (const item of value) {
			const trimmedItem = trimToByteLimit(item, maxBytes);
			const candidate = [...result, trimmedItem];
			if (serializedByteLength(candidate) > maxBytes) break;
			result.push(trimmedItem);
		}
		if (result.length < value.length && serializedByteLength([...result, TRUNCATED]) <= maxBytes) result.push(TRUNCATED);
		return result;
	}
	if (isObject(value)) {
		// 上限調整中も`__proto__`を安全に属性として扱えるようにします。
		const result = createAttributeMap();
		for (const key of Object.keys(value).sort()) {
			const candidate = Object.assign(createAttributeMap(), result, { [key]: trimToByteLimit(value[key], maxBytes) });
			if (serializedByteLength(candidate) > maxBytes) break;
			result[key] = candidate[key];
		}
		if (Object.keys(result).length < Object.keys(value).length) {
			const candidate = Object.assign(createAttributeMap(), result, { [TRUNCATED_KEY]: TRUNCATED });
			if (serializedByteLength(candidate) <= maxBytes) return candidate;
		}
		return result;
	}
	return TRUNCATED;
}

/** エラーらしい原因情報かを安全に判定します。特殊な値もログ処理を壊しません。 */
function isErrorLike(value: unknown): value is Record<string, unknown> {
	if (!isObject(value)) return false;
	try {
		return ['name', 'message', 'stack', 'cause'].some(key => key in value);
	} catch {
		return false;
	}
}

/** 属性をJSONへ出力できるオブジェクトへ正規化します。 */
export function normalizeLogAttributes(value: unknown, options: LogNormalizationOptions = {}): LogAttributes {
	const limits = resolveLogNormalizationLimits(options);
	const redactor = options.redactor ?? defaultLogRedactor;
	const normalized = normalizeValue(value, [], 0, new WeakSet<object>(), limits, redactor);
	const root = isObject(normalized) && !Array.isArray(normalized) ? normalized : { value: normalized };
	return trimToByteLimit(root as LogAttributes, limits.maxBytes) as LogAttributes;
}

/** 旧APIのdata領域から、エラー本体を見つけて構造化した形へ渡します。 */
export function findLegacyLogError(value: unknown): unknown {
	if (isErrorValue(value)) return value;
	if (!isObject(value)) return undefined;
	for (const key of ['e', 'err', 'error', 'stack']) {
		const candidate = readProperty(value, key);
		if (isErrorValue(candidate)) return candidate;
	}
	return undefined;
}

/** エラーの原因情報を含めて、一定の形へ正規化します。 */
function serializeErrorValue(
	value: unknown,
	depth: number,
	seen: WeakSet<object>,
	limits: LogNormalizationLimits,
	redactor: LogRedactor,
): SerializedError {
	if (!isObject(value)) {
		return {
			type: value === null ? 'null' : typeof value,
			message: normalizeString(stringifySafely(value), limits.maxStringBytes),
		};
	}
	if (seen.has(value)) return { type: 'CircularError', message: CIRCULAR };
	seen.add(value);

	try {
		const name = readProperty(value, 'name');
		const message = readProperty(value, 'message');
		const stack = readProperty(value, 'stack');
		const cause = readProperty(value, 'cause');
		const constructor = readProperty(value, 'constructor');
		const constructorName = typeof constructor === 'function' || isObject(constructor)
			? readProperty(constructor as Record<string, unknown>, 'name')
			: undefined;
		const type = normalizeString(
			typeof name === 'string' && name.length > 0
				? name
				: typeof constructorName === 'string' && constructorName.length > 0 ? constructorName : 'Error',
			limits.maxStringBytes,
		);
		const result: { type: string; message: string; stack?: string; cause?: SerializedError | LogAttributeValue } = {
			type,
			message: normalizeString(typeof message === 'string' ? message : stringifySafely(value), limits.maxStringBytes),
		};
		if (typeof stack === 'string') result.stack = normalizeString(stack, limits.maxStringBytes);
		if (typeof cause !== 'undefined') {
			result.cause = depth < limits.maxDepth
				? isErrorValue(cause) || isErrorLike(cause)
					? serializeErrorValue(cause, depth + 1, seen, limits, redactor)
					: normalizeValue(cause, ['cause'], depth + 1, seen, limits, redactor)
				: TRUNCATED;
		}
		return result;
	} finally {
		seen.delete(value);
	}
}

/** エラーの必須項目を残したまま、全体の出力サイズを上限内へ縮めます。 */
function trimSerializedError(value: SerializedError, maxBytes: number): SerializedError {
	const requiredLimit = Math.max(0, Math.floor((maxBytes - 24) / 2));
	const result: { type: string; message: string; stack?: string; cause?: SerializedError | LogAttributeValue } = {
		type: normalizeString(value.type, requiredLimit),
		message: normalizeString(value.message, requiredLimit),
	};
	if (serializedByteLength(result as unknown as LogAttributeValue) > maxBytes) {
		return { type: '', message: '' };
	}
	if (value.stack != null) {
		const candidate = { ...result, stack: value.stack };
		if (serializedByteLength(candidate as unknown as LogAttributeValue) <= maxBytes) result.stack = value.stack;
	}
	if (value.cause != null) {
		const cause = typeof value.cause === 'object'
			? trimToByteLimit(value.cause as LogAttributeValue, maxBytes)
			: value.cause;
		const candidate = { ...result, cause };
		if (serializedByteLength(candidate as unknown as LogAttributeValue) <= maxBytes) result.cause = cause as SerializedError | LogAttributeValue;
	}
	return result;
}

/** 任意のエラー入力を、ログへ安全に埋め込める形へ変換します。 */
export function serializeLogError(value: unknown, options: LogNormalizationOptions = {}): SerializedError | undefined {
	if (typeof value === 'undefined' || value === null) return undefined;
	const limits = resolveLogNormalizationLimits(options);
	// 必須項目を含む最小のJSON形すら収まらない場合は、上限を超えないよう出力しません。
	if (limits.maxBytes < 24) return undefined;
	const serialized = serializeErrorValue(value, 0, new WeakSet<object>(), limits, options.redactor ?? defaultLogRedactor);
	return trimSerializedError(serialized, limits.maxBytes);
}
