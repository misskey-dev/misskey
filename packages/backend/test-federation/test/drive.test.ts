import assert, { strictEqual } from 'node:assert';
import * as Misskey from 'misskey-js';
import { createAccount, deepStrictEqualWithExcludedFields, fetchAdmin, type LoginUser, resolveRemoteNote, resolveRemoteUser, sleep, uploadFile } from './utils.js';

const bAdmin = await fetchAdmin('b.test');

describe('Drive', () => {
	describe('Upload image in a.test and resolve from b.test', () => {
		let uploader: LoginUser;

		beforeAll(async () => {
			uploader = await createAccount('a.test');
		});

		let image: Misskey.entities.DriveFile, imageInB: Misskey.entities.DriveFile;

		describe('Upload', () => {
			beforeAll(async () => {
				image = await uploadFile('a.test', uploader);
				const noteWithImage = (await uploader.client.request('notes/create', { fileIds: [image.id] })).createdNote;
				const noteInB = await resolveRemoteNote('a.test', noteWithImage.id, bAdmin);
				assert(noteInB.files != null);
				strictEqual(noteInB.files.length, 1);
				imageInB = noteInB.files[0];
			});

			test('Check consistency of DriveFile', () => {
				// console.log(`a.test: ${JSON.stringify(image, null, '\t')}`);
				// console.log(`b.test: ${JSON.stringify(imageInB, null, '\t')}`);

				deepStrictEqualWithExcludedFields(image, imageInB, [
					'id',
					'createdAt',
					'size',
					'url',
					'thumbnailUrl',
					'userId',
				]);
			});
		});

		let updatedImage: Misskey.entities.DriveFile, updatedImageInB: Misskey.entities.DriveFile;

		describe('Update', () => {
			beforeAll(async () => {
				updatedImage = await uploader.client.request('drive/files/update', {
					fileId: image.id,
					name: 'updated_192.jpg',
					isSensitive: true,
				});

				updatedImageInB = await bAdmin.client.request('drive/files/show', {
					fileId: imageInB.id,
				});
			});

			test('Check consistency', () => {
				// console.log(`a.test: ${JSON.stringify(updatedImage, null, '\t')}`);
				// console.log(`b.test: ${JSON.stringify(updatedImageInB, null, '\t')}`);

				// FIXME: not updated with `drive/files/update`
				strictEqual(updatedImage.isSensitive, true);
				strictEqual(updatedImage.name, 'updated_192.jpg');
				strictEqual(updatedImageInB.isSensitive, false);
				strictEqual(updatedImageInB.name, '192.jpg');
			});
		});

		let reupdatedImageInB: Misskey.entities.DriveFile;

		describe('Re-update with attaching to Note', () => {
			beforeAll(async () => {
				const noteWithUpdatedImage = (await uploader.client.request('notes/create', { fileIds: [updatedImage.id] })).createdNote;
				const noteWithUpdatedImageInB = await resolveRemoteNote('a.test', noteWithUpdatedImage.id, bAdmin);
				assert(noteWithUpdatedImageInB.files != null);
				strictEqual(noteWithUpdatedImageInB.files.length, 1);
				reupdatedImageInB = noteWithUpdatedImageInB.files[0];
			});

			test('Check consistency', () => {
				// console.log(`b.test: ${JSON.stringify(reupdatedImageInB, null, '\t')}`);

				// `isSensitive` is updated
				strictEqual(reupdatedImageInB.isSensitive, true);
				// FIXME: but `name` is not updated
				strictEqual(reupdatedImageInB.name, '192.jpg');
			});
		});
	});

	describe('Sensitive flag', () => {
		describe('isSensitive is federated in delivering to followers', () => {
			let alice: LoginUser, bob: LoginUser;
			let bobInA: Misskey.entities.UserDetailedNotMe, aliceInB: Misskey.entities.UserDetailedNotMe;

			beforeAll(async () => {
				[alice, bob] = await Promise.all([
					createAccount('a.test'),
					createAccount('b.test'),
				]);

				[bobInA, aliceInB] = await Promise.all([
					resolveRemoteUser('b.test', bob.id, alice),
					resolveRemoteUser('a.test', alice.id, bob),
				]);

				await bob.client.request('following/create', { userId: aliceInB.id });
				await sleep();
			});

			test('Alice uploads sensitive image and it is shown as sensitive from Bob', async () => {
				const file = await uploadFile('a.test', alice);
				await alice.client.request('drive/files/update', { fileId: file.id, isSensitive: true });
				await alice.client.request('notes/create', { text: 'sensitive', fileIds: [file.id] });
				await sleep();

				const notes = await bob.client.request('notes/timeline', {});
				strictEqual(notes.length, 1);
				const noteInB = notes[0];
				assert(noteInB.files != null);
				strictEqual(noteInB.files.length, 1);
				strictEqual(noteInB.files[0].isSensitive, true);
			});
		});

		describe('isSensitive is federated in resolving', () => {
			let alice: LoginUser, bob: LoginUser;

			beforeAll(async () => {
				[alice, bob] = await Promise.all([
					createAccount('a.test'),
					createAccount('b.test'),
				]);
			});

			test('Alice uploads sensitive image and it is shown as sensitive from Bob', async () => {
				const file = await uploadFile('a.test', alice);
				await alice.client.request('drive/files/update', { fileId: file.id, isSensitive: true });
				const note = (await alice.client.request('notes/create', { text: 'sensitive', fileIds: [file.id] })).createdNote;

				const noteInB = await resolveRemoteNote('a.test', note.id, bob);
				assert(noteInB.files != null);
				strictEqual(noteInB.files.length, 1);
				strictEqual(noteInB.files[0].isSensitive, true);
			});
		});

		/** @see https://github.com/misskey-dev/misskey/issues/12208 */
		describe('isSensitive is federated in replying', () => {
			let alice: LoginUser, bob: LoginUser;

			beforeAll(async () => {
				[alice, bob] = await Promise.all([
					createAccount('a.test'),
					createAccount('b.test'),
				]);
			});

			test('Alice uploads sensitive image and it is shown as sensitive from Bob', async () => {
				const bobNote = (await bob.client.request('notes/create', { text: 'I\'m Bob' })).createdNote;

				const file = await uploadFile('a.test', alice);
				await alice.client.request('drive/files/update', { fileId: file.id, isSensitive: true });
				const bobNoteInA = await resolveRemoteNote('b.test', bobNote.id, alice);
				const note = (await alice.client.request('notes/create', { text: 'sensitive', fileIds: [file.id], replyId: bobNoteInA.id })).createdNote;
				await sleep();

				const noteInB = await resolveRemoteNote('a.test', note.id, bob);
				assert(noteInB.files != null);
				strictEqual(noteInB.files.length, 1);
				strictEqual(noteInB.files[0].isSensitive, true);
			});
		});
	});
});
