/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { LoggerService } from '@/core/LoggerService.js';
import { randomUUID } from 'node:crypto';

export const meta = {
	tags: ['account'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'MeDetailed',
	},

	errors: {
		userIsDeleted: {
			message: 'User is deleted.',
			code: 'USER_IS_DELETED',
			id: 'e5b3b9f0-2b8f-4b9f-9c1f-8c5c1b2e1b1a',
			kind: 'permission',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private loggerService: LoggerService,
		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, user, token, _file, _cleanup, ip, headers) => {
			const isSecure = token == null;

			const logger = this.loggerService.getLogger('api:account:i');
			logger.setContext({ userId: user?.id, username: user?.username, client: isSecure ? 'misskey' : 'app', ip, headers, span: (headers ? headers['x-client-transaction-id'] : undefined) ?? randomUUID() });
			logger.info('Fetching account information');

			const now = new Date();
			const today = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;

			// 渡ってきている user はキャッシュされていて古い可能性があるので改めて取得
			const userProfile = await this.userProfilesRepository.findOne({
				where: {
					userId: user.id,
				},
				relations: ['user'],
			});

			if (userProfile == null) {
				throw new ApiError(meta.errors.userIsDeleted);
			}

			if (!userProfile.loggedInDates.includes(today)) {
				this.userProfilesRepository.update({ userId: user.id }, {
					loggedInDates: [...userProfile.loggedInDates, today],
				});
				userProfile.loggedInDates = [...userProfile.loggedInDates, today];
			}

			try {
				const result = await this.userEntityService.pack(userProfile.user!, userProfile.user!, {
					schema: 'MeDetailed',
					includeSecrets: isSecure,
					userProfile,
				});
				logger.info('Returning account information');
				return result;
			} catch (error) {
				logger.error('Failed to pack user entity', { error });
				throw error;
			}
		});
	}
}
