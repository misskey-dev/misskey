import * as S3 from 'aws-sdk/clients/s3';
import { Meta } from '../../models/entities/meta';
import { getAgentByUrl } from '@/misc/fetch';

export function getS3(meta: Meta) {
	const u = meta.objectStorageEndpoint != null
		? `${meta.objectStorageUseSSL ? 'https://' : 'http://'}${meta.objectStorageEndpoint}`
		: `${meta.objectStorageUseSSL ? 'https://' : 'http://'}example.net`;

	return new S3({
		endpoint: meta.objectStorageEndpoint || undefined,
		accessKeyId: meta.objectStorageAccessKey!,
		secretAccessKey: meta.objectStorageSecretKey!,
		region: meta.objectStorageRegion || undefined,
		sslEnabled: meta.objectStorageUseSSL,
		s3ForcePathStyle: !meta.objectStorageEndpoint	// AWS with endPoint omitted
			? false
			: meta.objectStorageS3ForcePathStyle,
		httpOptions: {
			agent: getAgentByUrl(new URL(u), !meta.objectStorageUseProxy)
		}
	});
}
