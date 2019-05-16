import * as Minio from 'minio';
import { DriveFile } from '../../models/entities/drive-file';
import { InternalStorage } from './internal-storage';
import { DriveFiles, Instances, Notes } from '../../models';
import { driveChart, perUserDriveChart, instanceChart } from '../chart';
import { fetchMeta } from '../../misc/fetch-meta';

export default async function(file: DriveFile, isExpired = false) {
	if (file.storedInternal) {
		InternalStorage.del(file.accessKey!);

		if (file.thumbnailUrl) {
			InternalStorage.del(file.thumbnailAccessKey!);
		}

		if (file.webpublicUrl) {
			InternalStorage.del(file.webpublicAccessKey!);
		}
	} else if (!file.isLink) {
		const meta = await fetchMeta();

		const minio = new Minio.Client({
			endPoint: meta.objectStorageEndpoint!,
			region: meta.objectStorageRegion ? meta.objectStorageRegion : undefined,
			port: meta.objectStoragePort ? meta.objectStoragePort : undefined,
			useSSL: meta.objectStorageUseSSL,
			accessKey: meta.objectStorageAccessKey!,
			secretKey: meta.objectStorageSecretKey!,
		});

		await minio.removeObject(meta.objectStorageBucket!, file.accessKey!);

		if (file.thumbnailUrl) {
			await minio.removeObject(meta.objectStorageBucket!, file.thumbnailAccessKey!);
		}

		if (file.webpublicUrl) {
			await minio.removeObject(meta.objectStorageBucket!, file.webpublicAccessKey!);
		}
	}

	// リモートファイル期限切れ削除後は直リンクにする
	if (isExpired && file.userHost !== null && file.uri != null) {
		DriveFiles.update(file.id, {
			isLink: true,
			url: file.uri,
			thumbnailUrl: null,
			webpublicUrl: null
		});
	} else {
		DriveFiles.delete(file.id);

		// TODO: トランザクション
		Notes.createQueryBuilder().delete()
			.where(':id = ANY(fileIds)', { id: file.id })
			.execute();
	}

	// 統計を更新
	driveChart.update(file, false);
	perUserDriveChart.update(file, false);
	if (file.userHost !== null) {
		instanceChart.updateDrive(file, false);
		Instances.decrement({ host: file.userHost }, 'driveUsage', file.size);
		Instances.decrement({ host: file.userHost }, 'driveFiles', 1);
	}
}
