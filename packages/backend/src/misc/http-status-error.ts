/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class HttpStatusError extends Error {
	public message: string;
	public statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.message = message;
		this.statusCode = statusCode;
	}
}
