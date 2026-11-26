/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository, UsersRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import { DriveService } from '@/core/DriveService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { AccountUpdateService } from '@/core/AccountUpdateService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	description: 'Delete an existing drive file.',

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '908939ec-e52b-4458-b395-1025195cea58',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '5eb8d909-2540-4970-90b8-dd6f86088121',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		fileId: { type: 'string', format: 'misskey:id' },
	},
	required: ['fileId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private driveService: DriveService,
		private roleService: RoleService,
		private globalEventService: GlobalEventService,
		private accountUpdateService: AccountUpdateService,
		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const file = await this.driveFilesRepository.findOneBy({ id: ps.fileId });

			if (file == null) {
				throw new ApiError(meta.errors.noSuchFile);
			}

			if (!await this.roleService.isModerator(me) && (file.userId !== me.id)) {
				throw new ApiError(meta.errors.accessDenied);
			}

			// キャッシュ由来の古い値を見ないよう、所有者の情報は DB から取り直す
			const owner = file.userId != null ? await this.usersRepository.findOneBy({ id: file.userId }) : null;
			const isAvatar = owner?.avatarId === file.id;
			const isBanner = owner?.bannerId === file.id;

			// アイコン/バナーに設定されているファイルの場合は、その設定を解除する
			if (owner != null && (isAvatar || isBanner)) {
				await this.unsetAvatarAndBanner(owner, file.id, isAvatar, isBanner);
			}

			await this.driveService.deleteFile(file, false, me);
		});
	}

	private async unsetAvatarAndBanner(user: MiUser, fileId: MiDriveFile['id'], unsetAvatar: boolean, unsetBanner: boolean) {
		// 対象ファイルが設定されたままの場合のみ解除する
		const [avatarResult, bannerResult] = await Promise.all([
			unsetAvatar ? this.usersRepository.update({ id: user.id, avatarId: fileId }, {
				avatarId: null,
				avatarUrl: null,
				avatarBlurhash: null,
			}) : null,
			unsetBanner ? this.usersRepository.update({ id: user.id, bannerId: fileId }, {
				bannerId: null,
				bannerUrl: null,
				bannerBlurhash: null,
			}) : null,
		]);

		if (!avatarResult?.affected && !bannerResult?.affected) return;

		if (this.userEntityService.isLocalUser(user)) {
			this.globalEventService.publishInternalEvent('localUserUpdated', { id: user.id });

			// Publish meUpdated event
			const iObj = await this.userEntityService.pack(user.id, user, {
				schema: 'MeDetailed',
			});
			this.globalEventService.publishMainStream(user.id, 'meUpdated', iObj);

			// フォロワーにUpdateを配信
			this.accountUpdateService.publishToFollowers(user.id);
		} else {
			this.globalEventService.publishInternalEvent('remoteUserUpdated', { id: user.id });
		}
	}
}
