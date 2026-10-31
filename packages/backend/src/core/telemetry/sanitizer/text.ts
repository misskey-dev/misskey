/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const text = new TextEncoder();

/**
 * 例外スタックトレースを生の UTF-8 バイト数で切る個別上限。
 * `boot/entry.ts` が `Error.stackTraceLimit = Infinity` を設定するため、深い呼び出しでは一つのスタックトレースが span 全体の上限を占めうる。
 */
export const exceptionStacktraceMaxBytes = 16 * 1024;

/**
 * 例外メッセージを生の UTF-8 バイト数で切る個別上限。
 *
 * span 全体は JSON 化後のバイト数で測るため、`"` や `\`、タブのエスケープで最大約二倍に膨張する。
 * 個別上限だけでは span の生存を保証できず、全体判定と event の縮退処理も必要になる。
 */
export const exceptionMessageMaxBytes = 4 * 1024;

/**
 * 自由形式の文字列から、表示の偽装や端末操作に使われる制御文字を除去する。
 * SQL 本文と例外情報で同じ規則を使う。
 *
 * ESC と CR/LF の列挙だけでは、`U+009B` を `ESC-[` と等価な 8-bit CSI として解釈する端末や、
 * 表示済みの文字を消せる backspace による偽装を防げないため、C0・DEL・C1 全体を対象にする。
 */
export function stripLogInjectionControlChars(value: string): string {
	// SQL の整形に使われるタブだけは残す。
	// eslint-disable-next-line no-control-regex
	return value.replace(/[\x00-\x08\x0a-\x1f\x7f-\x9f]/g, '');
}

/** 自由形式の文字列に埋め込まれた `scheme://...` 形式の URL。 */
const embeddedUrlPattern = /\b[A-Za-z][A-Za-z0-9+.-]*:\/\/[^\s"'`<>()[\]{}]+/g;

/**
 * 自由形式の文字列に含まれる URL を、origin だけに置き換える。
 *
 * 例外メッセージには ActivityPub の URI や Webhook の送信先などが埋め込まれうるため、path・query・認証情報を残さない。
 * origin を持たない URL (`postgres://user:pass@host` など) や解釈できない URL はマーカーに置き換える。
 * `file://` はスタックトレースのフレームに現れるサーバー上のソースの位置で、利用者の情報を含まないため残す。
 */
export function redactEmbeddedUrls(value: string, replacement: string): string {
	return value.replace(embeddedUrlPattern, match => {
		if (/^file:\/\//i.test(match)) {
			return match;
		}
		try {
			const origin = new URL(match).origin;
			return origin === 'null' ? replacement : origin;
		} catch {
			return replacement;
		}
	});
}

/**
 * 文字列をUTF-8バイト数の上限まで切り詰める。
 *
 * マルチバイト文字を壊さないよう、有効な文字境界まで末尾を戻す。
 * SQL 本文と例外情報の個別上限に共通で使う。
 */
export function truncateUtf8Bytes(value: string, maxBytes: number): string {
	const encoded = text.encode(value);
	if (encoded.byteLength <= maxBytes) {
		return value;
	}
	for (let end = maxBytes; end > 0; end--) {
		try {
			return new TextDecoder('utf-8', { fatal: true }).decode(encoded.subarray(0, end));
		} catch {
			// 不完全なマルチバイト列の途中だった場合、1バイトずつ戻って境界を探す。
		}
	}
	return '';
}
