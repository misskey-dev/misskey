/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { Schema } from '@/misc/json-schema.js';
import { EmailService } from '@/core/EmailService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:send-email',
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {
		to: { type: 'string' },
		subject: { type: 'string' },
		text: { type: 'string' },
	},
	required: ['to', 'subject', 'text'],
} as const satisfies Schema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private emailService: EmailService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.emailService.sendEmail(ps.to, ps.subject, ps.text, ps.text);
		});
	}
}
