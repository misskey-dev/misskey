import { rejects, strictEqual } from 'node:assert';
import * as Misskey from 'misskey-js';
import { createAccount, createModerator, resolveRemoteUser, sleep, type LoginUser } from './utils.js';

describe('Abuse report', () => {
	describe('Forwarding report', () => {
		let alice: LoginUser, bob: LoginUser, aModerator: LoginUser, bModerator: LoginUser;
		let bobInA: Misskey.entities.UserDetailedNotMe, aliceInB: Misskey.entities.UserDetailedNotMe;

		beforeAll(async () => {
			[alice, bob] = await Promise.all([
				createAccount('a.test'),
				createAccount('b.test'),
			]);

			[aModerator, bModerator] = await Promise.all([
				createModerator('a.test'),
				createModerator('b.test'),
			]);

			[bobInA, aliceInB] = await Promise.all([
				resolveRemoteUser('b.test', bob.id, alice),
				resolveRemoteUser('a.test', alice.id, bob),
			]);
		});

		test('Alice reports Bob, moderator in A forwards it, and B moderator receives it', async () => {
			const comment = crypto.randomUUID();
			await alice.client.request('users/report-abuse', { userId: bobInA.id, comment });
			const reports = await aModerator.client.request('admin/abuse-user-reports', {});
			const report = reports.filter(report => report.comment === comment)[0];
			await aModerator.client.request('admin/forward-abuse-user-report', { reportId: report.id });
			await sleep();

			const reportsInB = await bModerator.client.request('admin/abuse-user-reports', {});
			const reportInB = reportsInB.filter(report => report.comment.includes(comment))[0];
			// NOTE: reporter is not Alice, and is not moderator in A
			strictEqual(reportInB.reporter.url, 'https://a.test/@instance.actor');
			strictEqual(reportInB.targetUserId, bob.id);

			// NOTE: cannot forward multiple times
			await rejects(
				async () => await aModerator.client.request('admin/forward-abuse-user-report', { reportId: report.id }),
				(err: any) => {
					strictEqual(err.code, 'INTERNAL_ERROR');
					strictEqual(err.info.e.message, 'The report has already been forwarded.');
					return true;
				},
			);
		});
	});
});
