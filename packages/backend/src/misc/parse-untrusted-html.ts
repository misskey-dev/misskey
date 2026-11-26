/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as htmlParser from 'node-html-parser';

/** パースを受け付ける HTML の最大長 (UTF-16 code unit 数) */
export const UNTRUSTED_HTML_MAX_LENGTH = 1024 * 1024;

/** パース結果として受け付ける要素の最大ネスト深さ */
export const UNTRUSTED_HTML_MAX_DEPTH = 512;

/** 受け付ける開始タグ名の最大長 */
export const UNTRUSTED_HTML_MAX_TAG_NAME_LENGTH = 256;

/**
 * 最大長を超える開始タグ名
 *
 * node-html-parser は、現在の親要素と一致しない閉じタグを処理するたびに親のタグ名全体を大文字・小文字に変換する。
 * そのため長いタグ名の要素の中に一致しない閉じタグを並べると、パースに入力長の二乗の時間がかかる。
 * 文字クラスは node-html-parser のタグ名の文字クラスを包含するように広めに取っている。
 */
const tooLongTagNamePattern = new RegExp(`<[a-zA-Z][-.:\\w@\\u00B7\\u00C0-\\uFFFD]{${UNTRUSTED_HTML_MAX_TAG_NAME_LENGTH}}`);

export class UntrustedHtmlLimitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'UntrustedHtmlLimitError';
	}
}

/**
 * 終端の無い開始トークン (`<!--` や `<![CDATA[`) の `!` を `&#33;` に置き換える
 *
 * node-html-parser の tokenizer は `<!--[\s\S]*?-->` のような正規表現で開始トークンから終端を探す。
 * 後ろに終端の無い開始トークンでは毎回入力の末尾まで走査してから失敗するため、
 * それが並んだ入力ではパースに入力長の二乗の時間がかかる。
 * 終端の無い開始トークンはパーサーにとっても元々ただのテキストなので、
 * 先にテキストとして書き換えておけば、textContent などで得られる結果を変えずに線形時間で処理できる。
 *
 * `<` を残すのは、引用符の無い属性値に `<` が含まれるかどうかで node-html-parser が自己終了タグの扱いを変えるため。
 * `-->` と重なる `<!-->` のような開始トークンでも、`!` だけを書き換えれば手前のコメントの終端は壊れない。
 */
function escapeUnterminatedOpeners(html: string, opener: string, terminator: string): string {
	const lastTerminator = html.lastIndexOf(terminator);

	// 終端は opener の直後から探されるので、lastTerminator より手前で opener が終わっていなければ終端を持たない
	const from = lastTerminator === -1 ? 0 : Math.max(0, lastTerminator - opener.length + 1);
	if (!html.includes(opener, from)) return html;

	return html.slice(0, from) + html.slice(from).replaceAll(opener, `<&#33;${opener.slice(2)}`);
}

/**
 * 外部 (リモートサーバー・第三者のWebページ等) から取得した信頼できない HTML をパースする
 */
export function parseUntrustedHtml(
	html: string,
	options: {
		maxLength?: number;
		maxDepth?: number;
	} = {},
): htmlParser.HTMLElement {
	const maxLength = options.maxLength ?? UNTRUSTED_HTML_MAX_LENGTH;
	const maxDepth = options.maxDepth ?? UNTRUSTED_HTML_MAX_DEPTH;

	if (html.length > maxLength) {
		throw new UntrustedHtmlLimitError(`HTML is too large: ${html.length} > ${maxLength}`);
	}

	if (tooLongTagNamePattern.test(html)) {
		throw new UntrustedHtmlLimitError(`HTML has a tag name longer than ${UNTRUSTED_HTML_MAX_TAG_NAME_LENGTH}`);
	}

	// 長さの検査は元の入力に対して行い、書き換えで伸びた分は数えない
	let escaped = escapeUnterminatedOpeners(html, '<!--', '-->');
	escaped = escapeUnterminatedOpeners(escaped, '<![CDATA[', ']]>');

	const root = htmlParser.parse(escaped, { parseNoneClosedTags: true });

	// 再帰を使わずに深さを検査する
	const stack: [htmlParser.HTMLElement, number][] = [[root, 0]];
	for (let item = stack.pop(); item != null; item = stack.pop()) {
		const [element, depth] = item;
		if (depth > maxDepth) {
			throw new UntrustedHtmlLimitError(`HTML is nested too deeply: > ${maxDepth}`);
		}
		for (const child of element.childNodes) {
			if (child instanceof htmlParser.HTMLElement) {
				stack.push([child, depth + 1]);
			}
		}
	}

	return root;
}
