/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import { describe, expect, test } from 'vitest';
import { proxyForHpagent } from '@/misc/hpagent-proxy.js';
import type { HpagentProxyTarget } from '@/misc/hpagent-proxy.js';

function storedHostname(agent: HttpProxyAgent | HttpsProxyAgent): string {
	return (agent as unknown as { proxy: { hostname: string } }).proxy.hostname;
}

describe('proxyForHpagent', () => {
	test('drops IPv6 brackets before hpagent copies hostname to http.request', () => {
		const proxy = proxyForHpagent('http://user:p%40ss@[2001:db8::2]:3128');
		expect(proxy).toEqual({
			protocol: 'http:',
			hostname: '2001:db8::2',
			port: '3128',
			username: 'user',
			password: 'p%40ss',
		} satisfies HpagentProxyTarget);

		const httpAgent = new HttpProxyAgent({ proxy: proxy as string });
		const httpsAgent = new HttpsProxyAgent({ proxy: proxy as string });
		expect(storedHostname(httpAgent)).toBe('2001:db8::2');
		expect(storedHostname(httpsAgent)).toBe('2001:db8::2');
		httpAgent.destroy();
		httpsAgent.destroy();
	});

	test('leaves domain and IPv4 proxy strings for hpagent to parse', () => {
		expect(proxyForHpagent('http://proxy.example:3128')).toBe('http://proxy.example:3128');
		expect(proxyForHpagent('http://127.0.0.1:3128')).toBe('http://127.0.0.1:3128');
	});

	test('keeps an https IPv6 proxy protocol and the URL default port', () => {
		const proxy = proxyForHpagent('https://[::1]:443');
		expect(proxy).toMatchObject({
			protocol: 'https:',
			hostname: '::1',
			port: '',
		});
	});
});
