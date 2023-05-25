import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';

export const meta = {
} as const;

export const paramDef = {
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/emoji/delete-bulk'> {
	name = 'admin/emoji/delete-bulk' as const;
	constructor(
		private customEmojiService: CustomEmojiService,
	) {
		super(async (ps, me) => {
			await this.customEmojiService.deleteBulk(ps.ids);
		});
	}
}
