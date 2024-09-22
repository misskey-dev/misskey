import assert, { strictEqual } from 'node:assert';
import * as Misskey from 'misskey-js';
import { createAccount, deepStrictEqualWithExcludedFields, fetchAdmin, resolveRemoteNote, uploadFile } from './utils.js';

const [
	[, aAdminClient],
	[, bAdminClient],
] = await Promise.all([
	fetchAdmin('a.test'),
	fetchAdmin('b.test'),
]);

describe('Drive', () => {
	describe('Upload image in a.test and resolve from b.test', () => {
		let uploader: Misskey.entities.SigninResponse, uploaderClient: Misskey.api.APIClient;

		beforeAll(async () => {
			[uploader, uploaderClient] = await createAccount('a.test', aAdminClient);
		});

		let image: Misskey.entities.DriveFile, imageInBServer: Misskey.entities.DriveFile;

		describe('Upload', () => {
			beforeAll(async () => {
				image = await uploadFile('a.test', '../../test/resources/192.jpg', uploader.i);
				const noteWithImage = (await uploaderClient.request('notes/create', { fileIds: [image.id] })).createdNote;
				const noteInBServer = await resolveRemoteNote(`https://a.test/notes/${noteWithImage.id}`, bAdminClient);
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
				const noteWithUpdatedImageInBServer = await resolveRemoteNote(`https://a.test/notes/${noteWithUpdatedImage.id}`, bAdminClient);
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
});
