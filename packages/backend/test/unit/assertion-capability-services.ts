/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPairSync, verify } from 'node:crypto';
import { Response } from 'node-fetch';
import Fastify from 'fastify';
import { describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { parseRequestSignature } from '@misskey-dev/node-http-message-signatures';
import type * as Redis from 'ioredis';
import { UserKeypairService } from '@/core/UserKeypairService.js';
import { ApRequestService } from '@/core/activitypub/ApRequestService.js';
import { FetchAllowSoftFailMask } from '@/core/activitypub/misc/check-against-url.js';
import { FetchInstanceMetadataService } from '@/core/FetchInstanceMetadataService.js';
import { NodeinfoServerService } from '@/server/NodeinfoServerService.js';
import { MiUserKeypair } from '@/models/UserKeypair.js';
import { MiInstance } from '@/models/Instance.js';
import type { UserKeypairsRepository } from '@/models/_.js';
import type { GlobalEventService } from '@/core/GlobalEventService.js';
import type { UserEntityService } from '@/core/entities/UserEntityService.js';
import type Logger from '@/logger.js';

const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const ed = generateKeyPairSync('ed25519');
const pem = (pair: typeof rsa) => pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const publicPem = (pair: typeof rsa) => pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
const actorId = 'https://local.example/users/alice';
const target = 'https://remote.example:8443/inbox?cursor=1';

describe('assertionMethod capability service boundaries', () => {
	test.each(['00', '01', '02', '10', '11', '12', 'unknown', undefined])('GET and POST select the actual cached key for peer %s', async level => {
		const entity = new MiUserKeypair({ userId: 'alice', privateKey: pem(rsa), publicKey: publicPem(rsa), ed25519PrivateKey: pem(ed), ed25519PublicKey: publicPem(ed) });
		const repository = mock<UserKeypairsRepository>();
		repository.findOneByOrFail.mockResolvedValue(entity);
		const users = mock<UserEntityService>();
		users.genLocalUserUri.mockReturnValue(actorId);
		const keys = new UserKeypairService(mock<Redis.Redis>(), mock<Redis.Redis>(), repository, mock<GlobalEventService>(), users);
		const send = vi.fn(async (_url: string, _options: unknown) => {
			const response = new Response(JSON.stringify({ id: target, type: 'Person' }), { headers: { 'content-type': 'application/activity+json' } });
			Object.defineProperty(response, 'url', { value: target });
			return response;
		});
		const request: ApRequestService = Object.assign(Object.create(ApRequestService.prototype), {
			config: { userAgent: 'test' }, userKeypairService: keys, httpRequestService: { send }, logger: mock<Logger>(),
		});
		try {
			for (const method of ['GET', 'POST']) {
				send.mockClear();
				if (method === 'POST') await request.signedPost({ id: 'alice' }, target, { type: 'Update' }, level!);
				else await request.signedGet(target, { id: 'alice' }, FetchAllowSoftFailMask.Strict, level!);
				const call = send.mock.calls[0] as unknown as [string, { method: string; headers: Record<string, string> }];
				const parsed = parseRequestSignature({ url: target, ...call[1], headers: { ...call[1].headers, Host: new URL(target).host } });
				expect(parsed.version).toBe('draft');
				if (parsed.version !== 'draft') throw new Error('Expected draft signature');
				const isEd = level === '02';
				expect(parsed.value.keyId).toBe(actorId + (isEd ? '#ed25519-key' : '#main-key'));
				expect(verify(isEd ? null : 'sha256', Buffer.from(parsed.value.signingString), (isEd ? ed : rsa).publicKey, Buffer.from(parsed.value.params.signature, 'base64'))).toBe(true);
			}
			await request.signedPost({ id: 'alice' }, target, { type: 'Update' }, '02', undefined, true);
			const forced = send.mock.calls.at(-1) as unknown as [string, { headers: Record<string, string> }];
			expect(forced[1].headers.Signature).toContain('#main-key');
		} finally {
			keys.dispose();
		}
	});

	function metadataFixture(stored: string, advertised: unknown, fails = false) {
		const instance = Object.assign(new MiInstance(), { id: 'peer', host: 'remote.example', httpMessageSignaturesImplementationLevel: stored, infoUpdatedAt: new Date() });
		const getJson = vi.fn(async (url: string) => {
			if (url.endsWith('/manifest.json')) return {};
			if (fails) throw new Error('network failure');
			if (url.endsWith('/.well-known/nodeinfo')) return { links: [{ rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1', href: 'https://remote.example/nodeinfo/2.1' }] };
			return { metadata: { httpMessageSignaturesImplementationLevel: advertised } };
		});
		const update = vi.fn(async (_id: string, updates: Record<string, unknown>) => { Object.assign(instance, updates); });
		const service: FetchInstanceMetadataService = Object.assign(Object.create(FetchInstanceMetadataService.prototype), {
			logger: mock<Logger>(), httpColon: 'https://',
			httpRequestService: { getJson, getHtml: vi.fn(async () => { throw new Error('no HTML'); }), send: vi.fn(async () => ({ ok: false })) },
			federatedInstanceService: { fetchOrRegister: vi.fn(async () => instance), update }, redisClient: mock<Redis.Redis>(),
		});
		return { instance, getJson, update, service };
	}

	test.each(['01', '11'])('preserves persisted deprecated %s until a real refetch advertises 02', async stored => {
		const fixture = metadataFixture(stored, '02');
		await fixture.service.fetchInstanceMetadata(fixture.instance);
		expect(fixture.getJson).not.toHaveBeenCalled();
		expect(fixture.instance.httpMessageSignaturesImplementationLevel).toBe(stored);
		await fixture.service.fetchInstanceMetadata(fixture.instance, true);
		expect(fixture.getJson).toHaveBeenCalledWith('https://remote.example/nodeinfo/2.1');
		expect(fixture.instance.httpMessageSignaturesImplementationLevel).toBe('02');
	});

	test.each(['01', '11', '02', '12', undefined, 'x2'])('stores only the actual recognized marker after refetch: %s', async advertised => {
		const fixture = metadataFixture('01', advertised);
		await fixture.service.fetchInstanceMetadata(fixture.instance, true);
		expect(fixture.instance.httpMessageSignaturesImplementationLevel).toBe(advertised == null || advertised === 'x2' ? '00' : advertised);
	});

	test('failed NodeInfo retrieval preserves the persisted deprecated marker', async () => {
		const fixture = metadataFixture('11', '02', true);
		await fixture.service.fetchInstanceMetadata(fixture.instance, true);
		expect(fixture.instance.httpMessageSignaturesImplementationLevel).toBe('11');
		expect(fixture.update.mock.calls[0][1]).not.toHaveProperty('httpMessageSignaturesImplementationLevel');
	});

	test('advertises 02 from both actual NodeInfo endpoints without claiming RFC 9421', async () => {
		const service: NodeinfoServerService = Object.assign(Object.create(NodeinfoServerService.prototype), {
			config: { url: 'https://local.example', version: 'test' },
			systemAccountService: { fetch: vi.fn(async () => ({ username: 'proxy' })) },
			metaService: { fetch: vi.fn(async () => ({ policies: {}, repositoryUrl: 'https://example.com/repo' })) },
			notesChart: { getChart: vi.fn(async () => ({ local: { total: [1] } })) },
			usersChart: { getChart: vi.fn(async () => ({ local: { total: [1] } })) },
		});
		const fastify = Fastify();
		service.createServer(fastify, {}, () => {});
		try {
			for (const path of ['/nodeinfo/2.0', '/nodeinfo/2.1']) {
				const response = await fastify.inject({ url: path });
				expect(response.statusCode).toBe(200);
				expect(response.json().metadata.httpMessageSignaturesImplementationLevel).toBe('02');
			}
		} finally {
			await fastify.close();
		}
	});
});
