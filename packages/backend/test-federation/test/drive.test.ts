import assert, { strictEqual } from 'node:assert';
import * as Misskey from 'misskey-js';
import { createAccount, deepStrictEqualWithExcludedFields, fetchAdmin, resolveRemoteNote, resolveRemoteUser, sleep, uploadFile } from './utils.js';

const [, bAdminClient] = await fetchAdmin('b.test');

describe('Drive', () => {
	describe('Upload image in a.test and resolve from b.test', () => {
		let uploader: Misskey.entities.SigninResponse, uploaderClient: Misskey.api.APIClient;

		beforeAll(async () => {
			[uploader, uploaderClient] = await createAccount('a.test');
		});

		let image: Misskey.entities.DriveFile, imageInBServer: Misskey.entities.DriveFile;

		describe('Upload', () => {
			beforeAll(async () => {
				image = await uploadFile('a.test', '../../test/resources/192.jpg', uploader.i);
				const noteWithImage = (await uploaderClient.request('notes/create', { fileIds: [image.id] })).createdNote;
				const noteInBServer = await resolveRemoteNote('a.test', noteWithImage.id, bAdminClient);
				assert(noteInBServer.files != null);
				strictEqual(noteInBServer.files.length, 1);
				imageInBServer = noteInBServer.files[0];
			});

			test('Check consistency of DriveFile', () => {
				// console.log(`a.test: ${JSON.stringify(image, null, '\t')}`);
				// console.log(`b.test: ${JSON.stringify(imageInBServer, null, '\t')}`);

				deepStrictEqualWithExcludedFields(image, imageInBServer, [
					'id',
					'createdAt',
					'size',
					'url',
					'thumbnailUrl',
					'userId',
				]);
			});
		});

		let updatedImage: Misskey.entities.DriveFile, updatedImageInBServer: Misskey.entities.DriveFile;

		describe('Update', () => {
			beforeAll(async () => {
				updatedImage = await uploaderClient.request('drive/files/update', {
					fileId: image.id,
					name: 'updated_192.jpg',
					isSensitive: true,
				});

				updatedImageInBServer = await bAdminClient.request('drive/files/show', {
					fileId: imageInBServer.id,
				});
			});

			test('Check consistency', () => {
				// console.log(`a.test: ${JSON.stringify(updatedImage, null, '\t')}`);
				// console.log(`b.test: ${JSON.stringify(updatedImageInBServer, null, '\t')}`);

				// FIXME: not updated with `drive/files/update`
				strictEqual(updatedImage.isSensitive, true);
				strictEqual(updatedImage.name, 'updated_192.jpg');
				strictEqual(updatedImageInBServer.isSensitive, false);
				strictEqual(updatedImageInBServer.name, '192.jpg');
			});
		});

		let reupdatedImageInBServer: Misskey.entities.DriveFile;

		describe('Re-update with attaching to Note', () => {
			beforeAll(async () => {
				const noteWithUpdatedImage = (await uploaderClient.request('notes/create', { fileIds: [updatedImage.id] })).createdNote;
				const noteWithUpdatedImageInBServer = await resolveRemoteNote('a.test', noteWithUpdatedImage.id, bAdminClient);
				assert(noteWithUpdatedImageInBServer.files != null);
				strictEqual(noteWithUpdatedImageInBServer.files.length, 1);
				reupdatedImageInBServer = noteWithUpdatedImageInBServer.files[0];
			});

			test('Check consistency', () => {
				// console.log(`b.test: ${JSON.stringify(reupdatedImageInBServer, null, '\t')}`);

				// `isSensitive` is updated
				strictEqual(reupdatedImageInBServer.isSensitive, true);
				// FIXME: but `name` is not updated
				strictEqual(reupdatedImageInBServer.name, '192.jpg');
			});
		});
	});

	describe('Sensitive flag', () => {
		describe('isSensitive is federated in delivering to followers', () => {
			let alice: Misskey.entities.SigninResponse, aliceClient: Misskey.api.APIClient;
			let bob: Misskey.entities.SigninResponse, bobClient: Misskey.api.APIClient;
			let bobInAServer: Misskey.entities.UserDetailedNotMe, aliceInBServer: Misskey.entities.UserDetailedNotMe;

			beforeAll(async () => {
				[alice, aliceClient] = await createAccount('a.test');
				[bob, bobClient] = await createAccount('b.test');

				[bobInAServer, aliceInBServer] = await Promise.all([
					resolveRemoteUser('b.test', bob.id, aliceClient),
					resolveRemoteUser('a.test', alice.id, bobClient),
				]);

				await bobClient.request('following/create', { userId: aliceInBServer.id });
				await sleep(100);
			});

			test('Alice uploads sensitive image and it is shown as sensitive from Bob', async () => {
				const file = await uploadFile('a.test', '../../test/resources/192.jpg', alice.i);
				await aliceClient.request('drive/files/update', { fileId: file.id, isSensitive: true });
				await aliceClient.request('notes/create', { text: 'sensitive', fileIds: [file.id] });
				await sleep(100);

				const notes = await bobClient.request('notes/timeline', {});
				strictEqual(notes.length, 1);
				const noteInBServer = notes[0];
				assert(noteInBServer.files != null);
				strictEqual(noteInBServer.files.length, 1);
				strictEqual(noteInBServer.files[0].isSensitive, true);
			});
		});

		describe('isSensitive is federated in resolving', () => {
			let alice: Misskey.entities.SigninResponse, aliceClient: Misskey.api.APIClient;
			let bob: Misskey.entities.SigninResponse, bobClient: Misskey.api.APIClient;

			beforeAll(async () => {
				[alice, aliceClient] = await createAccount('a.test');
				[bob, bobClient] = await createAccount('b.test');
			});

			test('Alice uploads sensitive image and it is shown as sensitive from Bob', async () => {
				const file = await uploadFile('a.test', '../../test/resources/192.jpg', alice.i);
				await aliceClient.request('drive/files/update', { fileId: file.id, isSensitive: true });
				const note = (await aliceClient.request('notes/create', { text: 'sensitive', fileIds: [file.id] })).createdNote;

				const noteInBServer = await resolveRemoteNote('a.test', note.id, bobClient);
				assert(noteInBServer.files != null);
				strictEqual(noteInBServer.files.length, 1);
				strictEqual(noteInBServer.files[0].isSensitive, true);
			});
		});

		/** @see https://github.com/misskey-dev/misskey/issues/12208 */
		describe('isSensitive is federated in replying', () => {
			let alice: Misskey.entities.SigninResponse, aliceClient: Misskey.api.APIClient;
			let bob: Misskey.entities.SigninResponse, bobClient: Misskey.api.APIClient;

			beforeAll(async () => {
				[alice, aliceClient] = await createAccount('a.test');
				[bob, bobClient] = await createAccount('b.test');
			});

			test('Alice uploads sensitive image and it is shown as sensitive from Bob', async () => {
				const bobNote = (await bobClient.request('notes/create', { text: 'I\'m Bob' })).createdNote;

				const file = await uploadFile('a.test', '../../test/resources/192.jpg', alice.i);
				await aliceClient.request('drive/files/update', { fileId: file.id, isSensitive: true });
				const bobNoteInAServer = await resolveRemoteNote('b.test', bobNote.id, aliceClient);
				const note = (await aliceClient.request('notes/create', { text: 'sensitive', fileIds: [file.id], replyId: bobNoteInAServer.id })).createdNote;
				await sleep(1000);

				const noteInBServer = await resolveRemoteNote('a.test', note.id, bobClient);
				assert(noteInBServer.files != null);
				strictEqual(noteInBServer.files.length, 1);
				strictEqual(noteInBServer.files[0].isSensitive, true);
			});
		});
	});
});
