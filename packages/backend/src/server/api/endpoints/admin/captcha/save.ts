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
	requireModerator: true,
	secure: true,

	// 実態はmetaの更新であるため
	kind: 'write:admin:meta',

	errors: {
		invalidProvider: {
			message: 'Invalid provider.',
			code: 'INVALID_PROVIDER',
			id: '14BF7AE1-80CC-4363-ACB2-4FD61D086AF0',
			httpStatusCode: 400,
		},
		invalidParameters: {
			message: 'Invalid parameters.',
			code: 'INVALID_PARAMETERS',
			id: '26654194-410E-44E2-B42E-460FF6F92476',
			httpStatusCode: 400,
		},
		noResponseProvided: {
			message: 'No response provided.',
			code: 'NO_RESPONSE_PROVIDED',
			id: '40ACBBA8-0937-41FB-BB3F-474514D40AFE',
			httpStatusCode: 400,
		},
		requestFailed: {
			message: 'Request failed.',
			code: 'REQUEST_FAILED',
			id: '0F4FE2F1-2C15-4D6E-B714-EFBFCDE231CD',
			httpStatusCode: 500,
		},
		verificationFailed: {
			message: 'Verification failed.',
			code: 'VERIFICATION_FAILED',
			id: 'C41C067F-24F3-4150-84B2-B5A3AE8C2214',
			httpStatusCode: 400,
		},
		unknown: {
			message: 'unknown',
			code: 'UNKNOWN',
			id: 'F868D509-E257-42A9-99C1-42614B031A97',
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
