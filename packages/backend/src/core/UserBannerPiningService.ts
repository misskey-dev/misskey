import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { bindThis } from '@/decorators.js';
import { MiUser } from '@/models/User.js';
import { MiUserBanner } from '@/models/UserBanner.js';
import type { MiUserBannerPining, UserBannerPiningRepository, UserBannerRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { IdService } from '@/core/IdService.js';

@Injectable()
export class UserBannerPiningService {
	constructor(
		@Inject(DI.userBannerRepository)
		private userBannerRepository: UserBannerRepository,
		@Inject(DI.userBannerPiningRepository)
		private userBannerPiningRepository: UserBannerPiningRepository,

		private idService: IdService,
	) {

	}

	/**
	 *	指定したユーザーのバナーをピン留めします
	 * @param userId
	 * @param bannerIds
	 */
	public async addPinned(userId: MiUser['id'], bannerIds: MiUserBanner['id'][]) {
		const pinsToInsert = bannerIds.map(bannerId => ({
			id: this.idService.gen(),
			userId,
			pinnedBannerId: bannerId,
		} as MiUserBannerPining));
		await this.userBannerPiningRepository
			.createQueryBuilder()
			.insert()
			.values(pinsToInsert)
			.orIgnore()
			.execute();
	}

	/**
	 * 指定したユーザーのバナーのピン留めを解除します
	 * @param userId
	 * @param bannerIds
	 */
	@bindThis
	public async removePinned(userId:MiUser['id'], bannerIds:MiUserBanner['id'][]) {
		await this.userBannerPiningRepository.delete({
			userId,
			pinnedBannerId: In(bannerIds),
		});
	}
}
