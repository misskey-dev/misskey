/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://www.fastify.io/docs/latest/Reference/Reply/#async-await-and-promises
export class FastifyReplyError extends Error {
	public message: string;
	public statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.message = message;
		this.statusCode = statusCode;
	}
}
