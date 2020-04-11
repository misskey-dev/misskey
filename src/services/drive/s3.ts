import * as S3 from 'aws-sdk/clients/s3';
import { Meta } from '../../models/entities/meta';
import { httpsAgent, httpAgent } from '../../misc/fetch';

export function getS3(meta: Meta) {
	return new S3({
		endpoint: meta.objectStorageEndpoint || undefined,
		accessKeyId: meta.objectStorageAccessKey!,
		secretAccessKey: meta.objectStorageSecretKey!,
		region: meta.objectStorageRegion || undefined,
		sslEnabled: meta.objectStorageUseSSL,
		s3ForcePathStyle: !!meta.objectStorageEndpoint,
		httpOptions: {
			agent: meta.objectStorageUseProxy ? (meta.objectStorageUseProxy ? httpsAgent : httpAgent) : undefined
		}
	});
}
