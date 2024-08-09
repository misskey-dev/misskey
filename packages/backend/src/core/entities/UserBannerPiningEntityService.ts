import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import type { MiUser } from '@/models/User.js';
import type { MiUserBannerPining } from '@/models/_.js';
import { UserBannerEntityService } from '@/core/entities/UserBannerEntityService.js';
import { Packed } from '@/misc/json-schema.js';

@Injectable()
export class UserBannerPiningEntityService {
	constructor(
		private userBannerEntityService: UserBannerEntityService,
	) {}

	@bindThis
	public async packMany(
		src: MiUserBannerPining[],
		me: { id: MiUser['id'] } | null | undefined,
	) : Promise<Packed<'UserBanner'>[]> {
		return (await Promise.allSettled(src.map(pining => this.userBannerEntityService.pack(pining.pinnedBannerId, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'UserBanner'>>).value);
	}
}
