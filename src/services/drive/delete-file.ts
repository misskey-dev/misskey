import * as Minio from 'minio';
import config from '../../config';
import { isRemoteUser } from '../../models/user';
import { DriveFile } from '../../models/drive-file';
import { del } from './internal-storage';
import { DriveFiles } from '../../models';

export default async function(file: DriveFile, isExpired = false) {
	if (file.storedInternal) {
		del(file);
	} else {
		const minio = new Minio.Client(config.drive.config);

		const obj = file.storage.key;
		await minio.removeObject(config.drive.bucket, obj);

		if (file.storage.thumbnailUrl) {
			const thumbnailObj = file.storage.thumbnailKey;
			await minio.removeObject(config.drive.bucket, thumbnailObj);
		}

		if (file.storage.webpublicUrl) {
			const webpublicObj = file.storage.webpublicKey;
			await minio.removeObject(config.drive.bucket, webpublicObj);
		}
	}

	// リモートファイル期限切れ削除後は直リンクにする
	if (isExpired && file._user && file._user.host != null) {
		DriveFiles.update(file.id, {
			isRemote: true,
			url: file.uri,
			thumbnailUrl: null,
			webpublicUrl: null
		});
	} else {
		DriveFiles.delete(file.id);
	}

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
