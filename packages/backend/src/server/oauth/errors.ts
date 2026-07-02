/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { StatusCode } from 'hono/utils/http-status';

export class OAuthProviderError extends Error {
	public error: string;
	public error_description?: string;
	public expose = true;
	public allow_redirect = true;
	public status: StatusCode = 400;
	public statusCode: StatusCode = 400;

	constructor(error: string, description?: string) {
		super(description ?? error);
		this.name = new.target.name;
		this.error = error;
		this.error_description = description;
	}
}

export class AccessDeniedError extends OAuthProviderError {
	constructor(description = 'access denied') {
		super('access_denied', description);
	}
}

export class InvalidGrantError extends OAuthProviderError {
	constructor(description = 'grant request is invalid') {
		super('invalid_grant', description);
	}
}

export class InvalidRequestError extends OAuthProviderError {
	constructor(description = 'request is invalid') {
		super('invalid_request', description);
	}
}

export class InvalidScopeError extends OAuthProviderError {
	public scope?: string;

	constructor(description = '`scope` parameter has no known scope', scope?: string) {
		super('invalid_scope', description);
		this.scope = scope;
	}
}

export class UnsupportedGrantTypeError extends OAuthProviderError {
	constructor(description = 'unsupported grant type requested') {
		super('unsupported_grant_type', description);
	}
}

export class UnsupportedResponseTypeError extends OAuthProviderError {
	constructor(description = 'unsupported response type requested') {
		super('unsupported_response_type', description);
	}
}

