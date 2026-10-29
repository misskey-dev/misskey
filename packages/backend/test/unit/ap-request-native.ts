/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPairSync, verify } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import * as slacc from 'slacc';
import { createSlaccSigningKey } from '@misskey-dev/node-http-message-signatures/node/slacc';
import { parseRequestSignature, verifyDraftSignature } from '@misskey-dev/node-http-message-signatures';
import { createSignedGet, createSignedPost } from '@/core/activitypub/ApRequestService.js';

describe.each(['rsa', 'ed25519'] as const)('native %s AP signing', type => {
	test.each(['GET', 'POST'])('%s preserves wire targets, authority, and queued signature semantics', async method => {
		const pair = type === 'rsa' ? generateKeyPairSync('rsa', { modulusLength: 2048 }) : generateKeyPairSync('ed25519');
		const key = createSlaccSigningKey(slacc, {
			keyId: 'https://example.com/actor#key', version: 'draft',
			algorithm: type === 'rsa' ? 'rsa-v1_5-sha256' : 'ed25519',
			privateKey: pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
		});
		for (const [path, target] of [
			['/inbox?token=abc', '/inbox?token=abc'],
			['/outbox?cursor=1#ignored', '/outbox?cursor=1'],
			['/outbox?#ignored', '/outbox?'],
			['/outbox?', '/outbox?'],
			['/outbox', '/outbox'],
		]) {
			const args = { level: type === 'rsa' ? '00' : '02', key, url: 'https://example.com:8443' + path, body: '{}', additionalHeaders: {} };
			const signed = method === 'POST' ? await createSignedPost(args) : await createSignedGet(args);
			expect(signed.signingString.split('\n')).toContain(`(request-target): ${method.toLowerCase()} ${target}`);
			expect(signed.signingString.split('\n')).toContain('host: example.com:8443');
			expect(verify(type === 'rsa' ? 'sha256' : null, Buffer.from(signed.signingString), pair.publicKey, Buffer.from(signed.signature, 'base64'))).toBe(true);
			const parsed = parseRequestSignature({ ...signed.request, url: target });
			expect(parsed.version).toBe('draft');
			if (parsed.version !== 'draft') throw new Error('Expected draft signature');
			const queued = JSON.parse(JSON.stringify(parsed.value));
			const publicKey = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
			expect(await verifyDraftSignature(queued, publicKey)).toBe(true);
			queued.signingString += 'changed';
			expect(await verifyDraftSignature(queued, publicKey)).toBe(false);
		}
	});
});
