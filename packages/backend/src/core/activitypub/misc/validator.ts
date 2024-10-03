/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Response } from 'node-fetch';

export function validateContentTypeSetAsActivityPub(response: Response): void {
	const contentType = (response.headers.get('content-type') ?? '').toLowerCase();

	if (contentType === '') {
		throw new Error('Validate content type of AP response: No content-type header');
	}
	if (
		contentType.startsWith('application/activity+json') ||
		(contentType.startsWith('application/ld+json;') && contentType.includes('https://www.w3.org/ns/activitystreams'))
	) {
		return;
	}
	throw new Error('Validate content type of AP response: Content type is not application/activity+json or application/ld+json');
}

const plusJsonSuffixRegex = /^\s*(application|text)\/[a-zA-Z0-9\.\-\+]+\+json\s*(;|$)/;

export function validateContentTypeSetAsJsonLD(response: Response): void {
	const contentType = (response.headers.get('content-type') ?? '').toLowerCase();

	if (contentType === '') {
		throw new Error('Validate content type of JSON LD: No content-type header');
	}
	if (
		contentType.startsWith('application/ld+json') ||
		contentType.startsWith('application/json') ||
		plusJsonSuffixRegex.test(contentType)
	) {
		return;
	}
	throw new Error('Validate content type of JSON LD: Content type is not application/ld+json or application/json');
}
