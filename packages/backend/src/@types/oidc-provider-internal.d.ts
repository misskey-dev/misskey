/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

declare module 'oidc-provider/lib/helpers/redirect_uri.js' {
	export default function redirectUri(uri: string, payload: Record<string, string>, mode: 'query' | 'fragment'): string;
}

declare module 'oidc-provider/lib/helpers/pkce.js' {
	export default function checkPKCE(verifier: string | undefined, challenge: string | undefined, method: string | undefined): void;
}
