/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type E = { message: string, code: string, id: string, kind?: 'client' | 'server' | 'permission', httpStatusCode?: number };

export class ApiError extends Error {
	public message: string;
	public code: string;
	public id: string;
	public kind: string;
	public httpStatusCode?: number;
	public info?: Record<string, string>;

	constructor(err: E, info?: Record<string, string> | null | undefined) {
		super(err.message);
		this.message = err.message;
		this.code = err.code;
		this.id = err.id;
		this.kind = err.kind ?? 'client';
		this.httpStatusCode = err.httpStatusCode;
		this.info = info ?? undefined;
	}
}
