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
		aliases: { type: 'array', items: {
			type: 'string',
		} },
	},
	required: ['ids', 'aliases'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/emoji/remove-aliases-bulk'> {
	name = 'admin/emoji/remove-aliases-bulk' as const;
	constructor(
		private customEmojiService: CustomEmojiService,
	) {
		super(async (ps, me) => {
			await this.customEmojiService.removeAliasesBulk(ps.ids, ps.aliases);
		});
	}
}
