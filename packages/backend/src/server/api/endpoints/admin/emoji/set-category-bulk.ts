import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		ids: { type: 'array', items: {
			type: 'string', format: 'misskey:id',
		} },
		category: {
			type: 'string',
			nullable: true,
			description: 'Use `null` to reset the category.',
		},
	},
	required: ['ids'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private customEmojiService: CustomEmojiService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.customEmojiService.setCategoryBulk(ps.ids, ps.category ?? null);
		});
	}
}
