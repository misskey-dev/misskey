import * as S3 from 'aws-sdk/clients/s3';
import config from '../../config';
import { Meta } from '../../models/entities/meta';
import * as httpsProxyAgent from 'https-proxy-agent';
import * as agentkeepalive from 'agentkeepalive';

const httpsAgent = config.proxy
	? new httpsProxyAgent(config.proxy)
	: new agentkeepalive.HttpsAgent({
			freeSocketTimeout: 30 * 1000
		});

export function getS3(meta: Meta) {
	const conf = {
		endpoint: meta.objectStorageEndpoint,
		accessKeyId: meta.objectStorageAccessKey,
		secretAccessKey: meta.objectStorageSecretKey,
		region: meta.objectStorageRegion,
		sslEnabled: meta.objectStorageUseSSL,
		httpOptions: {
		}
	} as S3.ClientConfiguration;

	if (meta.objectStorageUseSSL) {
		conf.httpOptions!.agent = httpsAgent;
	}

	const s3 = new S3(conf);

	return s3;
}
