/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

/** Valibot の issue 1 件を API エラー info に載せられる形に整えたもの */
export type ValibotIssueDetail = {
	/** dot-path (`poll.choices.0` など)。ルート自体の問題なら空文字列 */
	readonly path: string;
	readonly message: string;
	/** `'schema'` | `'validation'` | `'transformation'` */
	readonly kind: string;
	/** issue の種類 (`'string'` / `'min_length'` など) */
	readonly type: string;
	readonly expected?: string;
	readonly received?: string;
};

/**
 * `v.safeParse()` の issues を dot-path 付きの配列へ変換する。
 */
export function formatValibotIssues(issues: readonly v.BaseIssue<unknown>[]): ValibotIssueDetail[] {
	return issues.map(issue => {
		const detail: {
			path: string,
			message: string,
			kind: string,
			type: string,
			expected?: string,
			received?: string,
		} = {
			path: v.getDotPath(issue) ?? '',
			message: issue.message,
			kind: issue.kind,
			type: issue.type,
		};

		if (issue.expected !== null) detail.expected = issue.expected;
		detail.received = issue.received;

		return detail;
	});
}

export type InvalidParamInfo = {
	readonly param: string;
	readonly reason: string;
	readonly details: readonly ValibotIssueDetail[];
};

/**
 * `INVALID_PARAM` (`3d81ceae-475f-4600-b2a8-2bc116157532`) の info を組み立てる。
 *
 * `param` / `reason` キーは現行と互換 (値が schemaPath から dot-path に変わるのは意図的改善)。
 * `details` で複数エラーをまとめて返せるようにする。
 */
export function toInvalidParamInfo(issues: readonly v.BaseIssue<unknown>[]): InvalidParamInfo {
	const details = formatValibotIssues(issues);
	const path = details[0]?.path ?? '';

	return {
		param: path === '' ? '(root)' : path,
		reason: details[0]?.message ?? 'Invalid param.',
		details,
	};
}
