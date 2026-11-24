/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { isPrivateIp } from '@/download/http-agent.js';

describe(isPrivateIp, () => {
	test.each([
		'127.0.0.1',
		'10.0.0.1',
		'192.168.1.1',
		'::1',
		'fc00::1',
	])('%s はプライベートアドレス', (ip) => {
		expect(isPrivateIp(ip)).toBe(true);
	});

	test.each([
		'8.8.8.8',
		'2001:4860:4860::8888',
	])('%s はプライベートアドレスではない', (ip) => {
		expect(isPrivateIp(ip)).toBe(false);
	});

	test('IPv4-mapped IPv6 アドレスは IPv4 アドレスとして判定する', () => {
		expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true);
		expect(isPrivateIp('::ffff:8.8.8.8')).toBe(false);
	});

	test('allowedPrivateNetworks に含まれるアドレスは許可する', () => {
		expect(isPrivateIp('10.0.0.1', ['10.0.0.0/8'])).toBe(false);
		expect(isPrivateIp('::ffff:10.0.0.1', ['10.0.0.0/8'])).toBe(false);
		expect(isPrivateIp('192.168.1.1', ['10.0.0.0/8'])).toBe(true);
	});

	test('IPv6 のネットワークは IPv4 アドレスに一致させない', () => {
		expect(isPrivateIp('127.0.0.1', ['::/0'])).toBe(true);
	});
});
