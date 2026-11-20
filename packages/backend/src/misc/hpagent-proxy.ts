/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Fields hpagent reads from a non-string proxy.
 * Its types only list `string | URL`, but a string or URL keeps IPv6 brackets in `hostname`.
 */
export type HpagentProxyTarget = {
	protocol: string;
	hostname: string;
	port: string;
	username: string;
	password: string;
};

/**
 * hpagent copies `URL.hostname` into `http.request({ host })`.
 * For an IPv6 proxy that hostname still includes `[]`, and `getaddrinfo` then fails.
 * `URL.hostname` cannot store an IPv6 address without brackets, so those proxies are passed as fields.
 * Other proxy URLs stay strings and keep hpagent's own URL parsing.
 */
export function proxyForHpagent(proxy: string): string | HpagentProxyTarget {
	let url: URL;
	try {
		url = new URL(proxy);
	} catch {
		return proxy;
	}

	if (!url.hostname.startsWith('[') || !url.hostname.endsWith(']')) {
		return proxy;
	}

	return {
		protocol: url.protocol,
		hostname: url.hostname.slice(1, -1),
		port: url.port,
		username: url.username,
		password: url.password,
	};
}
