/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { EmailService } from '@/core/EmailService.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	res: v.object({
		available: v.boolean(),
		reason: v.nullable(v.string()),
	}),
} as const;

export const paramDef = v.object({
	emailAddress: v.string(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private emailService: EmailService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.emailService.validateEmailForAccount(ps.emailAddress);
		});
	}
}
