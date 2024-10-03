/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { entities } from 'misskey-js';
import { beforeEach, describe, test } from '@jest/globals';
import {
	api,
	captureWebhook,
	randomString,
	role,
	signup,
	startJobQueue,
	UserToken,
	WEBHOOK_HOST,
} from '../../utils.js';
import type { INestApplicationContext } from '@nestjs/common';

describe('[シナリオ] ユーザ通報', () => {
	let queue: INestApplicationContext;
	let admin: entities.SignupResponse;
	let alice: entities.SignupResponse;
	let bob: entities.SignupResponse;

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

	async function resolveAbuseReport(args?: Partial<entities.AdminResolveAbuseUserReportRequest>, credential?: UserToken): Promise<entities.EmptyResponse> {
		const res = await api(
			'admin/resolve-abuse-user-report',
			{
				reportId: admin.id,
				...args,
			},
			credential ?? admin,
		);
		return res.body;
	}

	// -------------------------------------------------------------------------------------------

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

	// -------------------------------------------------------------------------------------------

	describe('SystemWebhook', () => {
		beforeEach(async () => {
			const webhooks = await api('admin/system-webhook/list', {}, admin);
			for (const webhook of webhooks.body) {
				await api('admin/system-webhook/delete', { id: webhook.id }, admin);
			}
		});

		test('通報を受けた -> abuseReportが送出される', async () => {
			const webhook = await createSystemWebhook({
				on: ['abuseReport'],
				isActive: true,
			});
			await createAbuseReportNotificationRecipient({ systemWebhookId: webhook.id });

			// 通報(bob -> alice)
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

		test('通報を受けた -> abuseReportが送出される -> 解決 -> abuseReportResolvedが送出される', async () => {
			const webhook = await createSystemWebhook({
				on: ['abuseReport', 'abuseReportResolved'],
				isActive: true,
			});
			await createAbuseReportNotificationRecipient({ systemWebhookId: webhook.id });

			// 通報(bob -> alice)
			const abuse = {
				userId: alice.id,
				comment: randomString(),
			};
			const webhookBody1 = await captureWebhook(async () => {
				await createAbuseReport(abuse, bob);
			});

			console.log(JSON.stringify(webhookBody1, null, 2));
			expect(webhookBody1.hookId).toBe(webhook.id);
			expect(webhookBody1.type).toBe('abuseReport');
			expect(webhookBody1.body.targetUserId).toBe(alice.id);
			expect(webhookBody1.body.reporterId).toBe(bob.id);
			expect(webhookBody1.body.assigneeId).toBeNull();
			expect(webhookBody1.body.resolved).toBe(false);
			expect(webhookBody1.body.comment).toBe(abuse.comment);

			// 解決
			const webhookBody2 = await captureWebhook(async () => {
				await resolveAbuseReport({
					reportId: webhookBody1.body.id,
					forward: false,
				}, admin);
			});

			console.log(JSON.stringify(webhookBody2, null, 2));
			expect(webhookBody2.hookId).toBe(webhook.id);
			expect(webhookBody2.type).toBe('abuseReportResolved');
			expect(webhookBody2.body.targetUserId).toBe(alice.id);
			expect(webhookBody2.body.reporterId).toBe(bob.id);
			expect(webhookBody2.body.assigneeId).toBe(admin.id);
			expect(webhookBody2.body.resolved).toBe(true);
			expect(webhookBody2.body.comment).toBe(abuse.comment);
		});

		test('通報を受けた -> abuseReportが未許可の場合は送出されない', async () => {
			const webhook = await createSystemWebhook({
				on: [],
				isActive: true,
			});
			await createAbuseReportNotificationRecipient({ systemWebhookId: webhook.id });

			// 通報(bob -> alice)
			const abuse = {
				userId: alice.id,
				comment: randomString(),
			};
			const webhookBody = await captureWebhook(async () => {
				await createAbuseReport(abuse, bob);
			}).catch(e => e.message);

			expect(webhookBody).toBe('timeout');
		});

		test('通報を受けた -> abuseReportが未許可の場合は送出されない -> 解決 -> abuseReportResolvedが送出される', async () => {
			const webhook = await createSystemWebhook({
				on: ['abuseReportResolved'],
				isActive: true,
			});
			await createAbuseReportNotificationRecipient({ systemWebhookId: webhook.id });

			// 通報(bob -> alice)
			const abuse = {
				userId: alice.id,
				comment: randomString(),
			};
			const webhookBody1 = await captureWebhook(async () => {
				await createAbuseReport(abuse, bob);
			}).catch(e => e.message);

			expect(webhookBody1).toBe('timeout');

			const abuseReportId = (await api('admin/abuse-user-reports', {}, admin)).body[0].id;

			// 解決
			const webhookBody2 = await captureWebhook(async () => {
				await resolveAbuseReport({
					reportId: abuseReportId,
					forward: false,
				}, admin);
			});

			console.log(JSON.stringify(webhookBody2, null, 2));
			expect(webhookBody2.hookId).toBe(webhook.id);
			expect(webhookBody2.type).toBe('abuseReportResolved');
			expect(webhookBody2.body.targetUserId).toBe(alice.id);
			expect(webhookBody2.body.reporterId).toBe(bob.id);
			expect(webhookBody2.body.assigneeId).toBe(admin.id);
			expect(webhookBody2.body.resolved).toBe(true);
			expect(webhookBody2.body.comment).toBe(abuse.comment);
		});

		test('通報を受けた -> abuseReportが送出される -> 解決 -> abuseReportResolvedが未許可の場合は送出されない', async () => {
			const webhook = await createSystemWebhook({
				on: ['abuseReport'],
				isActive: true,
			});
			await createAbuseReportNotificationRecipient({ systemWebhookId: webhook.id });

			// 通報(bob -> alice)
			const abuse = {
				userId: alice.id,
				comment: randomString(),
			};
			const webhookBody1 = await captureWebhook(async () => {
				await createAbuseReport(abuse, bob);
			});

			console.log(JSON.stringify(webhookBody1, null, 2));
			expect(webhookBody1.hookId).toBe(webhook.id);
			expect(webhookBody1.type).toBe('abuseReport');
			expect(webhookBody1.body.targetUserId).toBe(alice.id);
			expect(webhookBody1.body.reporterId).toBe(bob.id);
			expect(webhookBody1.body.assigneeId).toBeNull();
			expect(webhookBody1.body.resolved).toBe(false);
			expect(webhookBody1.body.comment).toBe(abuse.comment);

			// 解決
			const webhookBody2 = await captureWebhook(async () => {
				await resolveAbuseReport({
					reportId: webhookBody1.body.id,
					forward: false,
				}, admin);
			}).catch(e => e.message);

			expect(webhookBody2).toBe('timeout');
		});

		test('通報を受けた -> abuseReportが未許可の場合は送出されない -> 解決 -> abuseReportResolvedが未許可の場合は送出されない', async () => {
			const webhook = await createSystemWebhook({
				on: [],
				isActive: true,
			});
			await createAbuseReportNotificationRecipient({ systemWebhookId: webhook.id });

			// 通報(bob -> alice)
			const abuse = {
				userId: alice.id,
				comment: randomString(),
			};
			const webhookBody1 = await captureWebhook(async () => {
				await createAbuseReport(abuse, bob);
			}).catch(e => e.message);

			expect(webhookBody1).toBe('timeout');

			const abuseReportId = (await api('admin/abuse-user-reports', {}, admin)).body[0].id;

			// 解決
			const webhookBody2 = await captureWebhook(async () => {
				await resolveAbuseReport({
					reportId: abuseReportId,
					forward: false,
				}, admin);
			}).catch(e => e.message);

			expect(webhookBody2).toBe('timeout');
		});

		test('通報を受けた -> Webhookが無効の場合は送出されない', async () => {
			const webhook = await createSystemWebhook({
				on: ['abuseReport', 'abuseReportResolved'],
				isActive: false,
			});
			await createAbuseReportNotificationRecipient({ systemWebhookId: webhook.id });

			// 通報(bob -> alice)
			const abuse = {
				userId: alice.id,
				comment: randomString(),
			};
			const webhookBody1 = await captureWebhook(async () => {
				await createAbuseReport(abuse, bob);
			}).catch(e => e.message);

			expect(webhookBody1).toBe('timeout');

			const abuseReportId = (await api('admin/abuse-user-reports', {}, admin)).body[0].id;

			// 解決
			const webhookBody2 = await captureWebhook(async () => {
				await resolveAbuseReport({
					reportId: abuseReportId,
					forward: false,
				}, admin);
			}).catch(e => e.message);

			expect(webhookBody2).toBe('timeout');
		});

		test('通報を受けた -> 通知設定が無効の場合は送出されない', async () => {
			const webhook = await createSystemWebhook({
				on: ['abuseReport', 'abuseReportResolved'],
				isActive: true,
			});
			await createAbuseReportNotificationRecipient({ systemWebhookId: webhook.id, isActive: false });

			// 通報(bob -> alice)
			const abuse = {
				userId: alice.id,
				comment: randomString(),
			};
			const webhookBody1 = await captureWebhook(async () => {
				await createAbuseReport(abuse, bob);
			}).catch(e => e.message);

			expect(webhookBody1).toBe('timeout');

			const abuseReportId = (await api('admin/abuse-user-reports', {}, admin)).body[0].id;

			// 解決
			const webhookBody2 = await captureWebhook(async () => {
				await resolveAbuseReport({
					reportId: abuseReportId,
					forward: false,
				}, admin);
			}).catch(e => e.message);

			expect(webhookBody2).toBe('timeout');
		});
	});
});
