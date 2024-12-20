/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { CaptchaService, supportedCaptchaProviders } from '@/core/CaptchaService.js';

export const meta = {
	tags: ['admin', 'captcha'],

	requireCredential: true,
	requireModerator: true,
	secure: true,

	kind: 'read:admin:captcha',

	res: {
		type: 'object',
		properties: {
			success: {
				type: 'boolean',
			},
			error: {
				type: 'object',
				nullable: true,
				optional: false,
				properties: {
					code: {
						type: 'string',
					},
					message: {
						type: 'string',
					},
				},
			},
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
			const result = await this.captchaService.save(ps.provider, ps.captchaResult, {
				sitekey: ps.sitekey,
				secret: ps.secret,
				instanceUrl: ps.instanceUrl,
			});

			if (result.success) {
				return { success: true, error: null };
			} else {
				return {
					success: false,
					error: {
						code: result.error.code.toString(),
						message: result.error.message,
					},
				};
			}
		});
	}
}
