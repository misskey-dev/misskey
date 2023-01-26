import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import S3 from 'aws-sdk/clients/s3.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { Meta } from '@/models/entities/Meta.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class S3Service {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private httpRequestService: HttpRequestService,
	) {
	}

	@bindThis
	public getS3(meta: Meta) {
		const u = meta.objectStorageEndpoint != null
			? `${meta.objectStorageUseSSL ? 'https://' : 'http://'}${meta.objectStorageEndpoint}`
			: `${meta.objectStorageUseSSL ? 'https://' : 'http://'}example.net`;
	
		return new S3({
			endpoint: meta.objectStorageEndpoint ?? undefined,
			accessKeyId: meta.objectStorageAccessKey!,
			secretAccessKey: meta.objectStorageSecretKey!,
			region: meta.objectStorageRegion ?? undefined,
			sslEnabled: meta.objectStorageUseSSL,
			s3ForcePathStyle: !meta.objectStorageEndpoint	// AWS with endPoint omitted
				? false
				: meta.objectStorageS3ForcePathStyle,
			httpOptions: {
				agent: this.httpRequestService.getAgentByUrl(new URL(u), !meta.objectStorageUseProxy),
			},
		});
	}
}
