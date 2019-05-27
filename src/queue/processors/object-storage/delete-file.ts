import * as Bull from 'bull';
import * as Minio from 'minio';
import { fetchMeta } from '../../../misc/fetch-meta';

export default async (job: Bull.Job) => {
	const meta = await fetchMeta();

	const minio = new Minio.Client({
		endPoint: meta.objectStorageEndpoint!,
		region: meta.objectStorageRegion ? meta.objectStorageRegion : undefined,
		port: meta.objectStoragePort ? meta.objectStoragePort : undefined,
		useSSL: meta.objectStorageUseSSL,
		accessKey: meta.objectStorageAccessKey!,
		secretKey: meta.objectStorageSecretKey!,
	});

	const key: string = job.data.key;

	await minio.removeObject(meta.objectStorageBucket!, key);

	return 'Success';
};
