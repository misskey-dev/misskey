/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** x1 (01/11) is the deprecated additionalPublicKeys proposal; x2 uses assertionMethod. */
export type HttpSignatureImplementationLevel = '00' | '01' | '02' | '10' | '11' | '12';

export const ASSERTION_METHOD_DRAFT_LEVEL = '02';

export function parseHttpSignatureImplementationLevel(value: unknown): HttpSignatureImplementationLevel {
	switch (value) {
		case '00': case '01': case '02': case '10': case '11': case '12': return value;
		default: return '00';
	}
}

/** We emit draft signatures only; an RFC 9421 marker does not enable that implementation. */
export function supportsDraftEd25519(value: unknown): boolean {
	return value === ASSERTION_METHOD_DRAFT_LEVEL;
}
