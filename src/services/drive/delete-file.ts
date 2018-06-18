import DriveFile, { DriveFileChunk, IDriveFile } from '../../models/drive-file';
import DriveFileThumbnail, { DriveFileThumbnailChunk } from '../../models/drive-file-thumbnail';

export default async function(file: IDriveFile, isExpired = false) {
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
