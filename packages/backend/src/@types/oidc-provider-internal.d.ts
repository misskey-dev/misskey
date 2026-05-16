/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

declare module 'oidc-provider/lib/helpers/errors.js' {
	import type { errors } from 'oidc-provider';
	export const OIDCProviderError: typeof errors.OIDCProviderError;
	export const AccessDenied: typeof errors.AccessDenied;
	export const InvalidGrant: typeof errors.InvalidGrant;
	export const InvalidRequest: typeof errors.InvalidRequest;
	export const InvalidScope: typeof errors.InvalidScope;
	export const UnsupportedGrantType: typeof errors.UnsupportedGrantType;
	export const UnsupportedResponseType: typeof errors.UnsupportedResponseType;
}

declare module 'oidc-provider/lib/helpers/redirect_uri.js' {
	export default function redirectUri(uri: string, payload: Record<string, string>, mode: 'query' | 'fragment'): string;
}

declare module 'oidc-provider/lib/helpers/pkce.js' {
	export default function checkPKCE(verifier: string | undefined, challenge: string | undefined, method: string | undefined): void;
}
