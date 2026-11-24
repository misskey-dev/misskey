/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as htmlParser from 'node-html-parser';

/** パースを受け付ける HTML の最大長 (UTF-16 code unit 数) */
export const UNTRUSTED_HTML_MAX_LENGTH = 1024 * 1024;

/** パース結果として受け付ける要素の最大ネスト深さ */
export const UNTRUSTED_HTML_MAX_DEPTH = 512;

export class UntrustedHtmlLimitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'UntrustedHtmlLimitError';
	}
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

	const root = htmlParser.parse(html, { parseNoneClosedTags: true });

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
