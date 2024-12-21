/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { captchaErrorCodes, CaptchaService, supportedCaptchaProviders } from '@/core/CaptchaService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin', 'captcha'],

	requireCredential: true,
	requireAdmin: true,

	// 実態はmetaの更新であるため
	kind: 'write:admin:meta',

	errors: {
		invalidProvider: {
			message: 'Invalid provider.',
			code: 'INVALID_PROVIDER',
			id: '14bf7ae1-80cc-4363-acb2-4fd61d086af0',
			httpStatusCode: 400,
		},
		invalidParameters: {
			message: 'Invalid parameters.',
			code: 'INVALID_PARAMETERS',
			id: '26654194-410e-44e2-b42e-460ff6f92476',
			httpStatusCode: 400,
		},
		noResponseProvided: {
			message: 'No response provided.',
			code: 'NO_RESPONSE_PROVIDED',
			id: '40acbba8-0937-41fb-bb3f-474514d40afe',
			httpStatusCode: 400,
		},
		requestFailed: {
			message: 'Request failed.',
			code: 'REQUEST_FAILED',
			id: '0f4fe2f1-2c15-4d6e-b714-efbfcde231cd',
			httpStatusCode: 500,
		},
		verificationFailed: {
			message: 'Verification failed.',
			code: 'VERIFICATION_FAILED',
			id: 'c41c067f-24f3-4150-84b2-b5a3ae8c2214',
			httpStatusCode: 400,
		},
		unknown: {
			message: 'unknown',
			code: 'UNKNOWN',
			id: 'f868d509-e257-42a9-99c1-42614b031a97',
			httpStatusCode: 500,
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		provider: {
			type: 'string',
			enum: supportedCaptchaProviders,
		},
		captchaResult: {
			type: 'string', nullable: true,
		},
		sitekey: {
			type: 'string', nullable: true,
		},
		secret: {
			type: 'string', nullable: true,
		},
		instanceUrl: {
			type: 'string', nullable: true,
		},
	},
	required: ['provider'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private captchaService: CaptchaService,
	) {
		super(meta, paramDef, async (ps) => {
			const result = await this.captchaService.save(ps.provider, {
				sitekey: ps.sitekey,
				secret: ps.secret,
				instanceUrl: ps.instanceUrl,
				captchaResult: ps.captchaResult,
			});

			if (!result.success) {
				switch (result.error.code) {
					case captchaErrorCodes.invalidProvider:
						throw new ApiError({
							...meta.errors.invalidProvider,
							message: result.error.message,
						});
					case captchaErrorCodes.invalidParameters:
						throw new ApiError({
							...meta.errors.invalidParameters,
							message: result.error.message,
						});
					case captchaErrorCodes.noResponseProvided:
						throw new ApiError({
							...meta.errors.noResponseProvided,
							message: result.error.message,
						});
					case captchaErrorCodes.requestFailed:
						throw new ApiError({
							...meta.errors.requestFailed,
							message: result.error.message,
						});
					case captchaErrorCodes.verificationFailed:
						throw new ApiError({
							...meta.errors.verificationFailed,
							message: result.error.message,
						});
					default:
						throw new ApiError(meta.errors.unknown);
				}
			}
		});
	}
}
