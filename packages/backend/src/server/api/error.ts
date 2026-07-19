/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { StatusCode } from 'hono/utils/http-status';

type E = { message: string, code: string, id: string, kind?: 'client' | 'server' | 'permission', httpStatusCode?: StatusCode };

export class ApiError extends Error {
	public message: string;
	public code: string;
	public id: string;
	public kind: string;
	public httpStatusCode?: StatusCode;
	public info?: any;

	constructor(err?: E | null | undefined, info?: any | null | undefined) {
		if (err == null) err = {
			message: 'Internal error occurred. Please contact us if the error persists.',
			code: 'INTERNAL_ERROR',
			id: '5d37dbcb-891e-41ca-a3d6-e690c97775ac',
			kind: 'server',
			httpStatusCode: 500,
		};

		super(err.message);
		this.message = err.message;
		this.code = err.code;
		this.id = err.id;
		this.kind = err.kind ?? 'client';
		this.httpStatusCode = err.httpStatusCode;
		this.info = info;
	}
}
