/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { StatusCode } from 'hono/utils/http-status';

export class StatusError extends Error {
	public statusCode: StatusCode;
	public statusMessage?: string;
	public isClientError: boolean;
	public isRetryable: boolean;

	constructor(message: string, statusCode: StatusCode, statusMessage?: string) {
		super(message);
		this.name = 'StatusError';
		this.statusCode = statusCode;
		this.statusMessage = statusMessage;
		this.isClientError = typeof this.statusCode === 'number' && this.statusCode >= 400 && this.statusCode < 500;
		this.isRetryable = !this.isClientError || this.statusCode === 429;
	}
}
