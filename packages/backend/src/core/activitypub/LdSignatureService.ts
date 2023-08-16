/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { bindThis } from '@/decorators.js';
import { CONTEXTS } from './misc/contexts.js';
import type { JsonLdDocument } from 'jsonld';
import type { JsonLd, RemoteDocument } from 'jsonld/jsonld-spec.js';

// RsaSignature2017 based from https://github.com/transmute-industries/RsaSignature2017

class LdSignature {
	public debug = false;
	public preLoad = true;
	public loderTimeout = 5000;

	constructor(
		private httpRequestService: HttpRequestService,
	) {
	}

	@bindThis
	public async signRsaSignature2017(data: any, privateKey: string, creator: string, domain?: string, created?: Date): Promise<any> {
		const options: {
			type: string;
			creator: string;
			domain?: string;
			nonce: string;
			created: string;
		} = {
			type: 'RsaSignature2017',
			creator,
			nonce: crypto.randomBytes(16).toString('hex'),
			created: (created ?? new Date()).toISOString(),
		};

		if (domain) {
			options.domain = domain;
		}

		const toBeSigned = await this.createVerifyData(data, options);

		const signer = crypto.createSign('sha256');
		signer.update(toBeSigned);
		signer.end();

		const signature = signer.sign(privateKey);

		return {
			...data,
			signature: {
				...options,
				signatureValue: signature.toString('base64'),
			},
		};
	}

	@bindThis
	public async verifyRsaSignature2017(data: any, publicKey: string): Promise<boolean> {
		const toBeSigned = await this.createVerifyData(data, data.signature);
		const verifier = crypto.createVerify('sha256');
		verifier.update(toBeSigned);
		return verifier.verify(publicKey, data.signature.signatureValue, 'base64');
	}

	@bindThis
	public async createVerifyData(data: any, options: any): Promise<string> {
		const transformedOptions = {
			...options,
			'@context': 'https://w3id.org/identity/v1',
		};
		delete transformedOptions['type'];
		delete transformedOptions['id'];
		delete transformedOptions['signatureValue'];
		const canonizedOptions = await this.normalize(transformedOptions);
		const optionsHash = this.sha256(canonizedOptions.toString());
		const transformedData = { ...data };
		delete transformedData['signature'];
		const cannonidedData = await this.normalize(transformedData);
		if (this.debug) console.debug(`cannonidedData: ${cannonidedData}`);
		const documentHash = this.sha256(cannonidedData.toString());
		const verifyData = `${optionsHash}${documentHash}`;
		return verifyData;
	}

	@bindThis
	public async normalize(data: JsonLdDocument): Promise<string> {
		const customLoader = this.getLoader();
		// XXX: Importing jsonld dynamically since Jest frequently fails to import it statically
		// https://github.com/misskey-dev/misskey/pull/9894#discussion_r1103753595
		return (await import('jsonld')).default.normalize(data, {
			documentLoader: customLoader,
		});
	}

	@bindThis
	private getLoader() {
		return async (url: string): Promise<RemoteDocument> => {
			if (!/^https?:\/\//.test(url)) throw new Error(`Invalid URL ${url}`);

			if (this.preLoad) {
				if (url in CONTEXTS) {
					if (this.debug) console.debug(`HIT: ${url}`);
					return {
						contextUrl: undefined,
						document: CONTEXTS[url],
						documentUrl: url,
					};
				}
			}

			if (this.debug) console.debug(`MISS: ${url}`);
			const document = await this.fetchDocument(url);
			return {
				contextUrl: undefined,
				document: document,
				documentUrl: url,
			};
		};
	}

	@bindThis
	private async fetchDocument(url: string): Promise<JsonLd> {
		const json = await this.httpRequestService.send(
			url,
			{
				headers: {
					Accept: 'application/ld+json, application/json',
				},
				timeout: this.loderTimeout,
			},
			{ throwErrorWhenResponseNotOk: false },
		).then(res => {
			if (!res.ok) {
				throw new Error(`${res.status} ${res.statusText}`);
			} else {
				return res.json();
			}
		});

		return json as JsonLd;
	}

	@bindThis
	public sha256(data: string): string {
		const hash = crypto.createHash('sha256');
		hash.update(data);
		return hash.digest('hex');
	}
}

@Injectable()
export class LdSignatureService {
	constructor(
		private httpRequestService: HttpRequestService,
	) {
	}

	@bindThis
	public use(): LdSignature {
		return new LdSignature(this.httpRequestService);
	}
}
