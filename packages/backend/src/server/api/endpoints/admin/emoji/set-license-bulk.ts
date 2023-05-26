import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/emoji/set-license-bulk'> {
	name = 'admin/emoji/set-license-bulk' as const;
	constructor(
		private customEmojiService: CustomEmojiService,
	) {
		super(async (ps, me) => {
			await this.customEmojiService.setLicenseBulk(ps.ids, ps.license ?? null);
		});
	}
}
