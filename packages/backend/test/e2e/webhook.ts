/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { entities } from 'misskey-js';
import { beforeEach, describe, test } from '@jest/globals';
import Fastify from 'fastify';
import { api, initTestDb, randomString, role, signup, startJobQueue, UserToken } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';

const WEBHOOK_HOST = 'http://localhost:15080';
const WEBHOOK_PORT = 15080;
process.env.NODE_ENV = 'test';

describe('webhook', () => {
	let queue: INestApplicationContext;
	let admin: entities.SignupResponse;
	let alice: entities.SignupResponse;
	let bob: entities.SignupResponse;

	type SystemWebhookPayload = {
		server: string;
		hookId: string;
		eventId: string;
		createdAt: string;
		type: string;
		body: any;
	}

	async function captureWebhook<T = SystemWebhookPayload>(postAction: () => Promise<void>): Promise<T> {
		const fastify = Fastify();

		const result = await new Promise<string>(async (resolve, reject) => {
			fastify.all('/', async (req, res) => {
				const body = JSON.stringify(req.body);
				res.status(200).send('ok');
				await fastify.close();
				resolve(body);
			});

			await fastify.listen({ port: WEBHOOK_PORT });

			setTimeout(async () => {
				await fastify.close();
				reject(new Error('timeout'));
			}, 3000);

			try {
				await postAction();
			} catch (e) {
				await fastify.close();
				reject(e);
			}
		});

		await fastify.close();

		return JSON.parse(result) as T;
	}

	async function createSystemWebhook(args?: Partial<entities.AdminSystemWebhookCreateRequest>, credential?: UserToken): Promise<entities.AdminSystemWebhookCreateResponse> {
		const res = await api(
			'admin/system-webhook/create',
			{
				isActive: true,
				name: randomString(),
				on: ['abuseReport'],
				url: WEBHOOK_HOST,
				secret: randomString(),
				...args,
			},
			credential ?? admin,
		);
		return res.body;
	}

	async function createAbuseReportNotificationRecipient(args?: Partial<entities.AdminAbuseReportNotificationRecipientCreateRequest>, credential?: UserToken): Promise<entities.AdminAbuseReportNotificationRecipientCreateResponse> {
		const res = await api(
			'admin/abuse-report/notification-recipient/create',
			{
				isActive: true,
				name: randomString(),
				method: 'webhook',
				...args,
			},
			credential ?? admin,
		);
		return res.body;
	}

	async function createAbuseReport(args?: Partial<entities.UsersReportAbuseRequest>, credential?: UserToken): Promise<entities.EmptyResponse> {
		const res = await api(
			'users/report-abuse',
			{
				userId: alice.id,
				comment: randomString(),
				...args,
			},
			credential ?? admin,
		);
		return res.body;
	}

	beforeAll(async () => {
		queue = await startJobQueue();
		admin = await signup({ username: 'admin' });
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });

		await role(admin, { isAdministrator: true });
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await queue.close();
	});

	beforeEach(async () => {
		const webhooks = await api('admin/system-webhook/list', {}, admin);
		for (const webhook of webhooks.body) {
			await api('admin/system-webhook/delete', { id: webhook.id }, admin);
		}
	});

	describe('system-webhook', () => {
		describe('abuseReport', () => {
			test('通報を受けた際にWebhookが送出される', async () => {
				const webhook = await createSystemWebhook({
					on: ['abuseReport'],
					isActive: true,
				});
				await createAbuseReportNotificationRecipient({ systemWebhookId: webhook.id });

				// bob -> alice
				const abuse = {
					userId: alice.id,
					comment: randomString(),
				};
				const webhookBody = await captureWebhook(async () => {
					await createAbuseReport(abuse, bob);
				});

				console.log(JSON.stringify(webhookBody, null, 2));

				expect(webhookBody.hookId).toBe(webhook.id);
				expect(webhookBody.type).toBe('abuseReport');
				expect(webhookBody.body.targetUserId).toBe(alice.id);
				expect(webhookBody.body.reporterId).toBe(bob.id);
				expect(webhookBody.body.comment).toBe(abuse.comment);
			});

			test('Webhookが無効の場合は送出されない', async () => {
				const webhook = await createSystemWebhook({
					on: ['abuseReport'],
					isActive: false,
				});
				await createAbuseReportNotificationRecipient({ systemWebhookId: webhook.id });

				// bob -> alice
				const abuse = {
					userId: alice.id,
					comment: randomString(),
				};
				const webhookBody = await captureWebhook(async () => {
					await createAbuseReport(abuse, bob);
				}).catch(e => e.message);

				expect(webhookBody).toBe('timeout');
			});

			test('通報を受けた際のWebhook送信が未許可の場合は送出されない', async () => {
				const webhook = await createSystemWebhook({
					on: [],
					isActive: true,
				});
				await createAbuseReportNotificationRecipient({ systemWebhookId: webhook.id });

				// bob -> alice
				const abuse = {
					userId: alice.id,
					comment: randomString(),
				};
				const webhookBody = await captureWebhook(async () => {
					await createAbuseReport(abuse, bob);
				}).catch(e => e.message);

				expect(webhookBody).toBe('timeout');
			});
		});
	});
});
