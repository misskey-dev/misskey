/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { CaptchaService, supportedCaptchaProviders } from '@/core/CaptchaService.js';

export const meta = {
	tags: ['admin', 'captcha'],

	requireCredential: true,
	requireAdmin: true,

	// 実態はmetaの取得であるため
	kind: 'read:admin:meta',

	res: v.object({
		provider: v.picklist([...supportedCaptchaProviders]),
		hcaptcha: v.object({
			siteKey: v.nullable(v.string()),
			secretKey: v.nullable(v.string()),
		}),
		mcaptcha: v.object({
			siteKey: v.nullable(v.string()),
			secretKey: v.nullable(v.string()),
			instanceUrl: v.nullable(v.string()),
		}),
		recaptcha: v.object({
			siteKey: v.nullable(v.string()),
			secretKey: v.nullable(v.string()),
		}),
		turnstile: v.object({
			siteKey: v.nullable(v.string()),
			secretKey: v.nullable(v.string()),
		}),
	}),
} as const;

export const paramDef = v.object({});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private captchaService: CaptchaService,
	) {
		super(meta, paramDef, async () => {
			return this.captchaService.get();
		});
	}
}
