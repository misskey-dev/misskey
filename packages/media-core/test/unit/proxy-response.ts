/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { createProxyResponseHeaders } from '../../src/proxy-response.js';

describe(createProxyResponseHeaders, () => {
	test('正常レスポンスのヘッダーを返す', () => {
		const headers = createProxyResponseHeaders('dummy.png', { ext: 'webp', type: 'image/webp' });

		expect(headers['Content-Type']).toBe('image/webp');
		expect(headers['Cache-Control']).toBe('max-age=31536000, immutable');
		expect(headers['Content-Disposition']).toMatch(/^inline;/);
		expect(headers['Content-Disposition']).toContain('dummy.png.webp');
	});

	test('拡張子が一致していればファイル名を変えない', () => {
		const headers = createProxyResponseHeaders('dummy.jpeg', { ext: 'jpg', type: 'image/jpeg' });

		expect(headers['Content-Disposition']).toBe('inline; filename=dummy.jpeg');
	});

	test('拡張子のないファイル名で形式が不明なら .unknown を付ける', () => {
		const headers = createProxyResponseHeaders('dummy', { ext: null, type: 'application/octet-stream' });

		expect(headers['Content-Disposition']).toContain('dummy.unknown');
	});
});
