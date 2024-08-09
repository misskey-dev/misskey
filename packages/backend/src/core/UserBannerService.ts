import { Inject, Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import { MiUser } from '@/models/User.js';
import { MiUserBanner } from '@/models/UserBanner.js';
import type { DriveFilesRepository, MiDriveFile, UserBannerRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { IdService } from '@/core/IdService.js';

@Injectable()
export class UserBannerService {
	constructor(
		@Inject(DI.userBannerRepository)
		private userBannerRepository: UserBannerRepository,
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private idService: IdService,
	) {

	}

	/**
	 * 指定したユーザーのバナーを作成します
	 * @param userId
	 * @param description
	 * @param url
	 * @param fileId
	 */
	@bindThis
	public async create(userId: MiUser['id'], description: string | null, url: string, fileId: MiDriveFile['id']) {
		const banner = await this.userBannerRepository.findOneBy({
			userId,
		});

		if (banner) throw new IdentifiableError('9dab45d9-cc66-4dfa-8305-610834e7f256', 'Already exists.');

		const file = await this.driveFilesRepository.findOneBy({
			id: fileId,
		});

		if (file == null) throw new IdentifiableError('e61187d1-9270-426b-8dc6-6b233c545133', 'No such file.');

		return await this.userBannerRepository.insert({
			id: this.idService.gen(),
			userId,
			description: description ?? null,
			fileId: file.id,
			url: url,
		} as MiUserBanner);
	}

	/**
	 * 指定したユーザーのバナーを更新します
	 * @param userId
	 * @param bannerId
	 * @param description
	 * @param url
	 * @param fileId
	 */
	@bindThis
	public async update(userId: MiUser['id'], bannerId: MiUserBanner['id'], description: string | null, url: string | null, fileId: MiDriveFile['id'] ) {
		const banner = await this.userBannerRepository.findOneBy({
			id: bannerId,
		});

		if (banner == null) {
			throw new IdentifiableError('ac26da32-1659-4fbb-82c2-fc11a494799f', 'No such banner.');
		}

		if (banner.userId !== userId) {
			throw new IdentifiableError('dfe79730-96f7-4d65-8c2a-b0975bf3524c', 'Not this user banner.');
		}

		const file = await this.driveFilesRepository.findOneBy({
			id: fileId,
		});

		if (file == null) {
			throw new IdentifiableError('e61187d1-9270-426b-8dc6-6b233c545133', 'No such file.');
		}

		await this.userBannerRepository.update({
			id: bannerId,
		}, {
			description: description ?? null,
			fileId: file.id,
			url: url ?? null,
		});
	}

	/**
	 * 指定したユーザーのバナー削除します
	 * @param userId
	 * @param bannerId
	 */
	@bindThis
	public async delete(userId: MiUser['id'], bannerId: MiUserBanner['id']) {
		const banner = await this.userBannerRepository.findOneBy({
			id: bannerId,
		});

		if (banner == null) {
			throw new IdentifiableError('f4b158a5-610f-4ed3-b228-3507ebe1bba6', 'No such banner.');
		}

		if (banner.userId !== userId) {
			throw new IdentifiableError('ad84053d-0cf4-4446-ac72-209adef15835', 'Not this user banner.');
		}

		await this.userBannerRepository.delete({
			id: bannerId,
		});
	}
}
