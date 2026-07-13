/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'node:assert';
import { beforeAll, describe, test } from 'vitest';
import { api, castAsError, signup } from '../utils.js';
import type * as misskey from 'misskey-js';

describe('Announcements', () => {
	let admin: misskey.entities.SignupResponse;

	beforeAll(async () => {
		admin = await signup({ username: 'admin' });
	});

	test('自動アーカイブ日時を過ぎるとアクティブ一覧と公開一覧から除外される', async () => {
		const create = await api('admin/announcements/create', {
			title: 'Scheduled announcement',
			text: 'Text',
			imageUrl: null,
			autoArchiveAt: Date.now() + 60_000,
		}, admin);

		assert.strictEqual(create.status, 200);
		const id = create.body.id;

		const activeBeforeExpiry = await api('admin/announcements/list', {
			status: 'active',
		}, admin);
		const listedAnnouncement = activeBeforeExpiry.body.find(announcement => announcement.id === id);
		assert.ok(listedAnnouncement);
		assert.strictEqual(typeof listedAnnouncement.autoArchiveAt, 'string');

		const clear = await api('admin/announcements/update', {
			id,
			autoArchiveAt: null,
		}, admin);
		assert.strictEqual(clear.status, 204);

		const activeAfterClearing = await api('admin/announcements/list', {
			status: 'active',
		}, admin);
		const clearedAnnouncement = activeAfterClearing.body.find(announcement => announcement.id === id);
		assert.ok(clearedAnnouncement);
		assert.strictEqual(clearedAnnouncement.autoArchiveAt, null);

		const update = await api('admin/announcements/update', {
			id,
			autoArchiveAt: Date.now() - 1_000,
		}, admin);
		assert.strictEqual(update.status, 204);

		const activeAfterExpiry = await api('admin/announcements/list', {
			status: 'active',
		}, admin);
		assert.strictEqual(activeAfterExpiry.body.some(announcement => announcement.id === id), false);

		const archived = await api('admin/announcements/list', {
			status: 'archived',
		}, admin);
		const archivedAnnouncement = archived.body.find(announcement => announcement.id === id);
		assert.ok(archivedAnnouncement);
		assert.strictEqual(archivedAnnouncement.isActive, false);

		const publicAnnouncements = await api('announcements', {});
		assert.strictEqual(publicAnnouncements.status, 200);
		assert.strictEqual(publicAnnouncements.body.some(announcement => announcement.id === id), false);
	});

	test('有効範囲外の自動アーカイブ日時はcreateとupdateで拒否される', async () => {
		const create = await api('admin/announcements/create', {
			title: 'Invalid scheduled announcement',
			text: 'Text',
			imageUrl: null,
			autoArchiveAt: -8_640_000_000_000_000,
		}, admin);

		assert.strictEqual(create.status, 400);
		assert.strictEqual(castAsError(create.body as any).error.code, 'INVALID_AUTO_ARCHIVE_AT');

		const scheduled = await api('admin/announcements/create', {
			title: 'Valid scheduled announcement',
			text: 'Text',
			imageUrl: null,
			autoArchiveAt: Date.now() + 60_000,
		}, admin);
		assert.strictEqual(scheduled.status, 200);

		const update = await api('admin/announcements/update', {
			id: scheduled.body.id,
			autoArchiveAt: -8_640_000_000_000_000,
		}, admin);
		assert.strictEqual(update.status, 400);
		assert.strictEqual(castAsError(update.body as any).error.code, 'INVALID_AUTO_ARCHIVE_AT');
	});
});
