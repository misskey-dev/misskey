/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IdentifiableError } from '@/misc/identifiable-error.js';

type ApErrorDef = { readonly id: string };

function mkErr(def: ApErrorDef, message?: string): IdentifiableError {
	return new IdentifiableError(def.id, message);
}

// Resolver
export const AP_RESOLVER_ERRORS = {
	UNRECOGNIZED_COLLECTION_TYPE: { id: 'f100eccf-f347-43fb-9b45-96a0831fb635' },
	URL_WITH_FRAGMENT: { id: 'b94fd5b1-0e3b-4678-9df2-dad4cd515ab2' },
	ALREADY_RESOLVED: { id: '0dc86cf6-7cd6-4e56-b1e6-5903d62d7ea5' },
	RECURSION_LIMIT: { id: 'd592da9f-822f-4d91-83d7-4ceefabcf3d2' },
	INSTANCE_BLOCKED: { id: '09d79f9e-64f1-4316-9cfa-e75c4d091574' },
	INVALID_RESPONSE: { id: '72180409-793c-4973-868e-5a118eb5519b' },
	NOT_LOCAL: { id: '02b40cd0-fa92-4b0c-acc9-fb2ada952ab8' },
	INVALID_FOLLOW_REQUEST_ID: { id: 'a9d946e5-d276-47f8-95fb-f04230289bb0' },
	FOLLOWER_OR_FOLLOWEE_NOT_FOUND: { id: '06ae3170-1796-4d93-a697-2611ea6d83b6' },
	UNHANDLED_TYPE: { id: '7a5d2fc0-94bc-4db6-b8b8-1bf24a2e23d0' },
} as const satisfies Record<string, ApErrorDef>;

// ApNoteService
export const AP_NOTE_ERRORS = {
	INVALID_NOTE: { id: 'd450b8a9-48e4-4dab-ae36-f4db763fda7c' },
	ACTOR_SUSPENDED: { id: '85ab9bd7-3a41-4530-959d-f07073900109' },
} as const satisfies Record<string, ApErrorDef>;

export function apResolverErr(def: typeof AP_RESOLVER_ERRORS[keyof typeof AP_RESOLVER_ERRORS], message?: string): IdentifiableError {
	return mkErr(def, message);
}

export function apNoteErr(def: typeof AP_NOTE_ERRORS[keyof typeof AP_NOTE_ERRORS], message?: string): IdentifiableError {
	return mkErr(def, message);
}
