/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { describe, beforeAll, test } from 'vitest';
import { api, castAsError, makeStreamCatcher, post, signup, uploadFile } from '../utils.js';
import type * as misskey from 'misskey-js';

describe('Drive', () => {
	let alice: misskey.entities.SignupResponse;
	let bob: misskey.entities.SignupResponse;
	let carol: misskey.entities.SignupResponse;

	beforeAll(async () => {
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
		carol = await signup({ username: 'carol' });
	}, 1000 * 60 * 2);

	test('ファイルURLからアップロードできる', async () => {
		// utils.js uploadUrl の処理だがAPIレスポンスも見るためここで同様の処理を書いている

		const marker = Math.random().toString();

		const url = 'https://raw.githubusercontent.com/misskey-dev/misskey/develop/packages/backend/test/resources/192.jpg';

		const catcher = makeStreamCatcher(
			alice,
			'main',
			(msg) => msg.type === 'urlUploadFinished' && msg.body.marker === marker,
			(msg) => msg.body.file,
			10 * 1000);

		const res = await api('drive/files/upload-from-url', {
			url,
			marker,
			force: true,
		}, alice);

		const file = await catcher;

		assert.strictEqual(res.status, 204);
		assert.strictEqual(file.name, '192.jpg');
		assert.strictEqual(file.type, 'image/jpeg');
	});

	test('ローカルからアップロードできる', async () => {
		// APIレスポンスを直接使用するので utils.js uploadFile が通過することで成功とする

		const res = await uploadFile(alice, { path: '192.jpg', name: 'テスト画像' });

		assert.strictEqual(res.body?.name, 'テスト画像.jpg');
		assert.strictEqual(res.body.type, 'image/jpeg');
	});

	test('存在しないフォルダを指定するとエラーになる', async () => {
		const existing = await uploadFile(alice);
		assert.strictEqual(existing.status, 200);

		for (const force of [true, false]) {
			const res = await uploadFile(alice, { folderId: '0000000000000000', force });

			assert.strictEqual(res.status, 400);
			assert.strictEqual(castAsError(res.body as any).error.id, 'b9adda75-abe9-4c6d-bf12-b5575833960d');
		}
	});

	test('添付ノート一覧を取得できる', async () => {
		const ids = (await Promise.all([uploadFile(alice), uploadFile(alice), uploadFile(alice)])).map(elm => elm.body!.id);

		const note0 = await post(alice, { fileIds: [ids[0]] });
		const note1 = await post(alice, { fileIds: [ids[0], ids[1]] });

		const attached0 = await api('drive/files/attached-notes', { fileId: ids[0] }, alice);
		assert.strictEqual(attached0.body.length, 2);
		assert.strictEqual(attached0.body[0].id, note1.id);
		assert.strictEqual(attached0.body[1].id, note0.id);

		const attached1 = await api('drive/files/attached-notes', { fileId: ids[1] }, alice);
		assert.strictEqual(attached1.body.length, 1);
		assert.strictEqual(attached1.body[0].id, note1.id);

		const attached2 = await api('drive/files/attached-notes', { fileId: ids[2] }, alice);
		assert.strictEqual(attached2.body.length, 0);
	});

	describe('ファイルの削除', () => {
		const ACCESS_DENIED = '5eb8d909-2540-4970-90b8-dd6f86088121';

		test('本人は通常のファイルを削除できる', async () => {
			const file = (await uploadFile(bob)).body!;

			const res = await api('drive/files/delete', { fileId: file.id }, bob);
			assert.strictEqual(res.status, 204);

			const show = await api('drive/files/show', { fileId: file.id }, bob);
			assert.strictEqual(show.status, 400);
		});

		test('本人がアイコン・バナーに設定中のファイルを削除すると、設定が解除される', async () => {
			const avatar = (await uploadFile(bob)).body!;
			const banner = (await uploadFile(bob)).body!;
			await api('i/update', { avatarId: avatar.id, bannerId: banner.id }, bob);

			const res1 = await api('drive/files/delete', { fileId: avatar.id }, bob);
			assert.strictEqual(res1.status, 204);

			// アイコンのみ解除され、バナーは残る
			const i1 = await api('i', {}, bob);
			assert.strictEqual(i1.body.avatarId, null);
			assert.strictEqual(i1.body.avatarBlurhash, null);
			assert.strictEqual(i1.body.bannerId, banner.id);

			const res2 = await api('drive/files/delete', { fileId: banner.id }, bob);
			assert.strictEqual(res2.status, 204);

			const i2 = await api('i', {}, bob);
			assert.strictEqual(i2.body.bannerId, null);
			assert.strictEqual(i2.body.bannerUrl, null);
			assert.strictEqual(i2.body.bannerBlurhash, null);
		});

		test('モデレーター以外は他人のアイコンに設定中のファイルを削除できない', async () => {
			const file = (await uploadFile(bob)).body!;
			await api('i/update', { avatarId: file.id }, bob);

			const res = await api('drive/files/delete', { fileId: file.id }, carol);
			assert.strictEqual(res.status, 400);
			assert.strictEqual(castAsError(res.body as any).error.id, ACCESS_DENIED);

			// 設定は解除されない
			const i = await api('i', {}, bob);
			assert.strictEqual(i.body.avatarId, file.id);

			await api('i/update', { avatarId: null }, bob);
		});

		test('モデレーターが他人のアイコン・バナーに設定中のファイルを削除すると、設定が解除される', async () => {
			const avatar = (await uploadFile(bob)).body!;
			const banner = (await uploadFile(bob)).body!;
			await api('i/update', { avatarId: avatar.id, bannerId: banner.id }, bob);

			// alice は最初に登録したユーザーなので root (管理者)
			const res1 = await api('drive/files/delete', { fileId: avatar.id }, alice);
			assert.strictEqual(res1.status, 204);
			const res2 = await api('drive/files/delete', { fileId: banner.id }, alice);
			assert.strictEqual(res2.status, 204);

			const i = await api('i', {}, bob);
			assert.strictEqual(i.status, 200);
			assert.strictEqual(i.body.avatarId, null);
			assert.strictEqual(i.body.avatarBlurhash, null);
			assert.strictEqual(i.body.bannerId, null);
			assert.strictEqual(i.body.bannerUrl, null);
			assert.strictEqual(i.body.bannerBlurhash, null);
		});
	});

	test('添付ノート一覧は他の人から見えない', async () => {
		const file = await uploadFile(alice);

		await post(alice, { fileIds: [file.body!.id] });

		const res = await api('drive/files/attached-notes', { fileId: file.body!.id }, bob);
		assert.strictEqual(res.status, 400);
		assert.strictEqual('error' in res.body, true);
	});
});
