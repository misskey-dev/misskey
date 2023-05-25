import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/emoji/delete'> {
	name = 'admin/emoji/delete' as const;
	constructor(
		private customEmojiService: CustomEmojiService,
	) {
		super(async (ps, me) => {
			await this.customEmojiService.delete(ps.id);
		});
	}
}
