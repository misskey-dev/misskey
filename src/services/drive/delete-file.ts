import * as Minio from 'minio';
import DriveFile, { DriveFileChunk, IDriveFile } from '../../models/drive-file';
import DriveFileThumbnail, { DriveFileThumbnailChunk } from '../../models/drive-file-thumbnail';
import config from '../../config';
import driveChart from '../chart/charts/drive';
import perUserDriveChart from '../chart/charts/per-user-drive';
import instanceChart from '../chart/charts/instance';
import DriveFileWebpublic, { DriveFileWebpublicChunk } from '../../models/drive-file-webpublic';
import Instance from '../../models/instance';
import { isRemoteUser } from '../../models/user';

export default async function(file: IDriveFile, isExpired = false) {
	if (file.metadata.storage == 'minio') {
		const minio = new Minio.Client(config.drive.config);

		// 後方互換性のため、file.metadata.storageProps.key があるかどうかチェックしています。
		// 将来的には const obj = file.metadata.storageProps.key; とします。
		const obj = file.metadata.storageProps.key ? file.metadata.storageProps.key : `${config.drive.prefix}/${file.metadata.storageProps.id}`;
		await minio.removeObject(config.drive.bucket, obj);

		if (file.metadata.thumbnailUrl) {
			// 後方互換性のため、file.metadata.storageProps.thumbnailKey があるかどうかチェックしています。
			// 将来的には const thumbnailObj = file.metadata.storageProps.thumbnailKey; とします。
			const thumbnailObj = file.metadata.storageProps.thumbnailKey ? file.metadata.storageProps.thumbnailKey : `${config.drive.prefix}/${file.metadata.storageProps.id}-thumbnail`;
			await minio.removeObject(config.drive.bucket, thumbnailObj);
		}

		if (file.metadata.webpublicUrl) {
			const webpublicObj = file.metadata.storageProps.webpublicKey ? file.metadata.storageProps.webpublicKey : `${config.drive.prefix}/${file.metadata.storageProps.id}-original`;
			await minio.removeObject(config.drive.bucket, webpublicObj);
		}
	}

	// チャンクをすべて削除
	await DriveFileChunk.remove({
		files_id: file.id
	});

	const set = {
		metadata: {
			deletedAt: new Date(),
			isExpired: isExpired
		}
	} as any;

	// リモートファイル期限切れ削除後は直リンクにする
	if (isExpired && file.metadata && file.metadata._user && file.metadata._user.host != null) {
		set.metadata.withoutChunks = true;
		set.metadata.isRemote = true;
		set.metadata.url = file.metadata.uri;
		set.metadata.thumbnailUrl = undefined;
		set.metadata.webpublicUrl = undefined;
	}

	await DriveFile.update({ _id: file.id }, {
		$set: set
	});

	//#region サムネイルもあれば削除
	const thumbnail = await DriveFileThumbnail.findOne({
		'metadata.originalId': file.id
	});

	if (thumbnail) {
		await DriveFileThumbnailChunk.remove({
			files_id: thumbnail.id
		});

		await DriveFileThumbnail.remove({ _id: thumbnail.id });
	}
	//#endregion

	//#region Web公開用もあれば削除
	const webpublic = await DriveFileWebpublic.findOne({
		'metadata.originalId': file.id
	});

	if (webpublic) {
		await DriveFileWebpublicChunk.remove({
			files_id: webpublic.id
		});

		await DriveFileWebpublic.remove({ _id: webpublic.id });
	}
	//#endregion

	// 統計を更新
	driveChart.update(file, false);
	perUserDriveChart.update(file, false);
	if (isRemoteUser(file.metadata._user)) {
		instanceChart.updateDrive(file, false);
		Instance.update({ host: file.metadata._user.host }, {
			$inc: {
				driveUsage: -file.length,
				driveFiles: -1
			}
		});
	}
}
