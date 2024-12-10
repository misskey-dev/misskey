/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import * as http from 'node:http';
import * as https from 'node:https';
import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { NodeHttpHandler, NodeHttpHandlerOptions } from '@smithy/node-http-handler';
import type { MiMeta } from '@/models/Meta.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { bindThis } from '@/decorators.js';
import type { DeleteObjectCommandInput, PutObjectCommandInput } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
	constructor(
		private httpRequestService: HttpRequestService,
	) {
	}

	@bindThis
	public getS3Client(meta: MiMeta): S3Client {
		const u = meta.objectStorageEndpoint
			? `${meta.objectStorageUseSSL ? 'https' : 'http'}://${meta.objectStorageEndpoint}`
			: `${meta.objectStorageUseSSL ? 'https' : 'http'}://example.net`; // dummy url to select http(s) agent

		const agent = this.httpRequestService.getAgentByUrl(new URL(u), !meta.objectStorageUseProxy, true);
		const handlerOption: NodeHttpHandlerOptions = {};
		if (meta.objectStorageUseSSL) {
			handlerOption.httpsAgent = agent as https.Agent;
		} else {
			handlerOption.httpAgent = agent as http.Agent;
		}

		return new S3Client({
			endpoint: meta.objectStorageEndpoint ? u : undefined,
			credentials: (meta.objectStorageAccessKey !== null && meta.objectStorageSecretKey !== null) ? {
				accessKeyId: meta.objectStorageAccessKey,
				secretAccessKey: meta.objectStorageSecretKey,
			} : undefined,
			region: meta.objectStorageRegion ? meta.objectStorageRegion : undefined, // 空文字列もundefinedにするため ?? は使わない
			tls: meta.objectStorageUseSSL,
			forcePathStyle: meta.objectStorageEndpoint ? meta.objectStorageS3ForcePathStyle : false, // AWS with endPoint omitted
			requestHandler: new NodeHttpHandler(handlerOption),
		});
	}

	@bindThis
	public async upload(meta: MiMeta, input: PutObjectCommandInput) {
		const client = this.getS3Client(meta);
		return new Upload({
			client,
			params: input,
			partSize: (client.config.endpoint && (await client.config.endpoint()).hostname === 'storage.googleapis.com')
				? 500 * 1024 * 1024
				: 8 * 1024 * 1024,
		}).done();
	}

	@bindThis
	public delete(meta: MiMeta, input: DeleteObjectCommandInput) {
		const client = this.getS3Client(meta);
		return client.send(new DeleteObjectCommand(input));
	}
}
