import * as Minio from 'minio';
import DriveFile, { DriveFileChunk, IDriveFile } from '../../models/drive-file';
import DriveFileThumbnail, { DriveFileThumbnailChunk } from '../../models/drive-file-thumbnail';
import config from '../../config';

export default async function(file: IDriveFile, isExpired = false) {
	if (file.metadata.storage == 'minio') {
		const minio = new Minio.Client(config.drive.config);

		const obj = `${config.drive.prefix}/${file.metadata.storageProps.id}`;
		await minio.removeObject(config.drive.bucket, obj);

		if (file.metadata.thumbnailUrl) {
			const thumbnailObj = `${config.drive.prefix}/${file.metadata.storageProps.id}-thumbnail`;
			await minio.removeObject(config.drive.bucket, thumbnailObj);
		}
	}

	// チャンクをすべて削除
	await DriveFileChunk.remove({
		files_id: file._id
	});

	await DriveFile.update({ _id: file._id }, {
		$set: {
			'metadata.deletedAt': new Date(),
			'metadata.isExpired': isExpired
		}
	});

	//#region サムネイルもあれば削除
	const thumbnail = await DriveFileThumbnail.findOne({
		'metadata.originalId': file._id
	});

	if (thumbnail) {
		await DriveFileThumbnailChunk.remove({
			files_id: thumbnail._id
		});

		await DriveFileThumbnail.remove({ _id: thumbnail._id });
	}
	//#endregion
}
