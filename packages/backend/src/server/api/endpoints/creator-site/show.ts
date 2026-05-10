/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { CreatorSitesRepository, UsersRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';
import type { FindOptionsWhere } from 'typeorm';

export const meta = {
	tags: ['creator-site'],

	requireCredential: false,

	description: 'Show creator site settings.',

	res: {
		optional: false,
		nullable: true,
		type: 'object',
		properties: {
			id: { type: 'string', optional: false, nullable: false },
			userId: { type: 'string', optional: false, nullable: false },
			title: { type: 'string', optional: false, nullable: true },
			catchphrase: { type: 'string', optional: false, nullable: true },
			commissionStatus: { type: 'string', optional: false, nullable: true },
			collabStatus: { type: 'string', optional: false, nullable: true },
			fanartStatus: { type: 'string', optional: false, nullable: true },
			guidelineUrl: { type: 'string', optional: false, nullable: true },
			guidelineText: { type: 'string', optional: false, nullable: true },
			createdAt: { type: 'string', optional: false, nullable: false, format: 'date-time' },
			updatedAt: { type: 'string', optional: false, nullable: false, format: 'date-time' },
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'ad632b56-93d5-4ce3-a1d5-creator-site-001',
			httpStatusCode: 404,
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		username: { type: 'string' },
		host: {
			type: 'string',
			nullable: true,
			description: 'The local host is represented with `null`.',
		},
	},
	anyOf: [
		{ required: ['userId'] },
		{ required: ['username'] },
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject('CreatorSitesRepository')
		private creatorSitesRepository: CreatorSitesRepository,
	) {
		super(meta, paramDef, async (ps) => {
			const q: FindOptionsWhere<MiUser> = 'userId' in ps
				? { id: ps.userId }
				: {
					usernameLower: ps.username!.trim().toLowerCase(),
					host: ps.host ?? IsNull(),
				};

			const user = await this.usersRepository.findOneBy(q);

			if (user == null || user.isSuspended) {
				throw new ApiError(meta.errors.noSuchUser);
			}

			const site = await this.creatorSitesRepository.findOneBy({
				userId: user.id,
			});

			if (site == null) {
				return null;
			}

			return {
				id: site.id,
				userId: site.userId,
				title: site.title,
				catchphrase: site.catchphrase,
				commissionStatus: site.commissionStatus,
				collabStatus: site.collabStatus,
				fanartStatus: site.fanartStatus,
				guidelineUrl: site.guidelineUrl,
				guidelineText: site.guidelineText,
				createdAt: site.createdAt.toISOString(),
				updatedAt: site.updatedAt.toISOString(),
			};
		});
	}
}
