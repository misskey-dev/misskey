/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Endpoints } from 'misskey-js';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';

class OidcPopupBlockedError extends Error {}

export function oidcErrorMessage(error: unknown) {
	return error instanceof OidcPopupBlockedError ? i18n.ts._oidc.popupBlocked : i18n.ts._oidc.failed;
}

export async function authorizeWithOidc(request: Endpoints['oidc/start']['req'], cancelled: AbortSignal) {
	const popup = window.open('about:blank', '_blank', 'popup');
	if (popup == null) throw new OidcPopupBlockedError();
	popup.opener = null;

	const signal = AbortSignal.any([cancelled, AbortSignal.timeout(300_000)]);
	try {
		const credential = request.mode === 'signin' ? null : undefined;
		const { url, state, browserSecret } = await misskeyApi<void, 'oidc/start'>('oidc/start', request, credential, signal);
		const channel = new BroadcastChannel('misskey:oidc:' + state);
		const authorizationResponse = await new Promise<string>((resolve, reject) => {
			signal.throwIfAborted();
			signal.addEventListener('abort', () => reject(signal.reason), { once: true });
			channel.onmessage = event => {
				if (typeof event.data !== 'string' || new URLSearchParams(event.data).get('state') !== state) return;
				channel.postMessage('received');
				resolve(event.data);
			};
			popup.location.replace(url);
		}).finally(() => channel.close());
		const context = { state, browserSecret };
		const response = await misskeyApi('oidc/finish', { ...context, authorizationResponse }, credential, signal);
		return { response, context };
	} finally {
		popup.close();
	}
}
