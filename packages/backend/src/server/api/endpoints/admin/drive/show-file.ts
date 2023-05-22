import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository, UsersRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/drive/show-file'> {
	name = 'admin/drive/show-file' as const;
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private roleService: RoleService,
	) {
		super(async (ps, me) => {
			const file = ps.fileId ? await this.driveFilesRepository.findOneBy({ id: ps.fileId }) : await this.driveFilesRepository.findOne({
				where: [{
					url: ps.url,
				}, {
					thumbnailUrl: ps.url,
				}, {
					webpublicUrl: ps.url,
				}],
			});

			if (file == null) {
				throw new ApiError(this.meta.errors.noSuchFile);
			}

			const owner = file.userId ? await this.usersRepository.findOneByOrFail({
				id: file.userId,
			}) : null;

			const iAmModerator = await this.roleService.isModerator(me);
			const ownerIsModerator = owner ? await this.roleService.isModerator(owner) : false;

			return {
				id: file.id,
				userId: file.userId,
				userHost: file.userHost,
				isLink: file.isLink,
				maybePorn: file.maybePorn,
				maybeSensitive: file.maybeSensitive,
				isSensitive: file.isSensitive,
				folderId: file.folderId,
				src: file.src,
				uri: file.uri,
				webpublicAccessKey: file.webpublicAccessKey,
				thumbnailAccessKey: file.thumbnailAccessKey,
				accessKey: file.accessKey,
				webpublicType: file.webpublicType,
				webpublicUrl: file.webpublicUrl,
				thumbnailUrl: file.thumbnailUrl,
				url: file.url,
				storedInternal: file.storedInternal,
				properties: file.properties,
				blurhash: file.blurhash,
				comment: file.comment,
				size: file.size,
				type: file.type,
				name: file.name,
				md5: file.md5,
				createdAt: file.createdAt.toISOString(),
				requestIp: iAmModerator ? file.requestIp : null,
				requestHeaders: iAmModerator && !ownerIsModerator ? file.requestHeaders : null,
			};
		});
	}
}
