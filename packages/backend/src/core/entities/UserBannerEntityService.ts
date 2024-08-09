import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { bindThis } from '@/decorators.js';
import type { MiUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository, MiUserBanner, UserBannerRepository } from '@/models/_.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import type { Packed } from '@/misc/json-schema.js';

@Injectable()
export class UserBannerEntityService implements OnModuleInit {
	private userEntityService: UserEntityService;
	constructor(
		@Inject(DI.userBannerRepository)
		private userBannerRepository: UserBannerRepository,
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
		private moduleRef: ModuleRef,
	) {
	}

	async onModuleInit() {
		this.userEntityService = this.moduleRef.get(UserEntityService.name);
	}

	@bindThis
	public async pack(
		src: MiUserBanner | MiUserBanner['id'] | null | undefined,
		me: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'UserBanner'>> {
		if (!src) throw new IdentifiableError('9dab45d9-cc66-4dfa-8305-610834e7f256', 'No such banner.');

		const banner = typeof src === 'object' ? src : await this.userBannerRepository.findOneByOrFail({ id: src });
		const file = await this.driveFilesRepository.findOneByOrFail({ id: banner.fileId });

		return {
			id: banner.id,
			user: await this.userEntityService.pack(banner.userId, me),
			description: banner.description,
			imgUrl: file.url,
			url: banner.url,
			fileId: file.id,
		};
	}

	@bindThis
	public async packMany(
		src: MiUserBanner[] | MiUserBanner['id'][],
		me: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'UserBanner'>[]> {
		return (await Promise.allSettled(src.map(x => this.pack(x, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'UserBanner'>>).value);
	}
}
