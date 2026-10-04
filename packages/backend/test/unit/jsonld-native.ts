/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPairSync, verify } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { JsonLd } from '@/core/activitypub/JsonLdService.js';
import type { HttpRequestService } from '@/core/HttpRequestService.js';

describe('JSON-LD native RSA signing', () => {
	test.each([2048, 4096])('preserves the raw UTF-8 signature base for RSA %i', async modulusLength => {
		const pair = generateKeyPairSync('rsa', { modulusLength });
		const privateKey = pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
		const publicKey = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
		const ld = new JsonLd(mock<HttpRequestService>());
		// Canonicalization is unchanged; independently verify the bytes handed to slacc.
		const base = '0123456789abcdef'.repeat(8);
		const createVerifyData = vi.spyOn(ld, 'createVerifyData').mockResolvedValue(base);
		const created = new Date('2026-10-04T00:00:00Z');
		const document = { id: 'https://example.com/object' };
		const signed = await ld.signRsaSignature2017(document, privateKey, 'https://example.com/actor#main-key', 'example.com', created);
		expect(signed.signature).toMatchObject({ type: 'RsaSignature2017', domain: 'example.com', created: created.toISOString() });
		expect(signed.id).toBe(document.id);
		expect(verify('sha256', Buffer.from(base), pair.publicKey, Buffer.from(signed.signature.signatureValue, 'base64'))).toBe(true);
		expect(await ld.verifyRsaSignature2017(signed, publicKey)).toBe(true);
		createVerifyData.mockResolvedValue(base + 'changed');
		expect(await ld.verifyRsaSignature2017(signed, publicKey)).toBe(false);
	});
});
