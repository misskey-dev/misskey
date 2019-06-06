import * as Bull from 'bull';
import * as Minio from 'minio';
import { fetchMeta } from '../../../misc/fetch-meta';

export default async (job: Bull.Job<{ key: string }>) => {
	const meta = await fetchMeta();

	const minio = new Minio.Client({
		endPoint: meta.objectStorageEndpoint!,
		region: meta.objectStorageRegion ? meta.objectStorageRegion : undefined,
		port: meta.objectStoragePort ? meta.objectStoragePort : undefined,
		useSSL: meta.objectStorageUseSSL,
		accessKey: meta.objectStorageAccessKey!,
		secretKey: meta.objectStorageSecretKey!,
	});

	await minio.removeObject(meta.objectStorageBucket!, job.data.key);

	return 'Success';
};
