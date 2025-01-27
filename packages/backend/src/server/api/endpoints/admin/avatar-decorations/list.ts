/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageAvatarDecorations',
	kind: 'read:admin:avatar-decorations',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
					example: 'xxxxxxxxxx',
				},
				createdAt: {
					type: 'string',
					optional: false, nullable: false,
					format: 'date-time',
				},
				updatedAt: {
					type: 'string',
					optional: false, nullable: true,
					format: 'date-time',
				},
				name: {
					type: 'string',
					optional: false, nullable: false,
				},
				description: {
					type: 'string',
					optional: false, nullable: false,
				},
				url: {
					type: 'string',
					optional: false, nullable: false,
				},
				roleIdsThatCanBeUsedThisDecoration: {
					type: 'array',
					optional: false, nullable: false,
					items: {
						type: 'string',
						optional: false, nullable: false,
						format: 'id',
					},
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
                private usersRepository: UsersRepository,

		private avatarDecorationService: AvatarDecorationService,
		private idService: IdService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const avatarDecorations = await this.avatarDecorationService.getAll(true);

                        const _me = await this.usersRepository.findOneByOrFail({ id: me.id });
			const isAdmin = await this.roleService.isAdministrator(_me);

			let myAvatarDecorations = avatarDecorations.filter( (item) => {
				return isAdmin || item.description.indexOf( me.id + '#' ) == 0;
			});

			if ( ! isAdmin ){
				myAvatarDecorations.forEach( (item) => {
					let new_description = item.description;
                                	let sh_in = new_description.indexOf('# ')
                                	if ( sh_in >=8 && sh_in < 16 ){
                                        	new_description = new_description.substr( sh_in + 2 );
                                	} else{
                                        	sh_in = new_description.indexOf('#')
                                        	if ( sh_in >=8 && sh_in < 16 ){
                                                	new_description = new_description.substr( sh_in + 1 );
                                        	}
                                	}
					item.description = new_description;
				});
			}

			return myAvatarDecorations.map(avatarDecoration => ({
				id: avatarDecoration.id,
				createdAt: this.idService.parse(avatarDecoration.id).date.toISOString(),
				updatedAt: avatarDecoration.updatedAt?.toISOString() ?? null,
				name: avatarDecoration.name,
				description: avatarDecoration.description,
				url: avatarDecoration.url,
				roleIdsThatCanBeUsedThisDecoration: avatarDecoration.roleIdsThatCanBeUsedThisDecoration,
			}));
		});
	}
}
