import * as S3 from 'aws-sdk/clients/s3';
import config from '../../config';
import { Meta } from '../../models/entities/meta';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as agentkeepalive from 'agentkeepalive';

const httpsAgent = config.proxy
	? new HttpsProxyAgent(config.proxy)
	: new agentkeepalive.HttpsAgent({
			freeSocketTimeout: 30 * 1000
		});

export function getS3(meta: Meta) {
	const conf = {
		endpoint: meta.objectStorageEndpoint || undefined,
		accessKeyId: meta.objectStorageAccessKey,
		secretAccessKey: meta.objectStorageSecretKey,
		region: meta.objectStorageRegion || undefined,
		sslEnabled: meta.objectStorageUseSSL,
		s3ForcePathStyle: true,
		httpOptions: {
		}
	} as S3.ClientConfiguration;

	if (meta.objectStorageUseSSL) {
		conf.httpOptions!.agent = httpsAgent;
	}

	const s3 = new S3(conf);

	return s3;
}
