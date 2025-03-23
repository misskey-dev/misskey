/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { RoleService } from '@/core/RoleService.js';
import type { UsersRepository } from '@/models/_.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

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
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
               	@Inject(DI.usersRepository)
                private usersRepository: UsersRepository,

		private avatarDecorationService: AvatarDecorationService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let decorations = await this.avatarDecorationService.getAll(true);
			const allRoles = await this.roleService.getRoles();

// following statement is ERROR
//			decorations.forEach( (item) =>{
////			});
			// await Promise.all(docorations.map(async (item) => {
			// }
			for( let item of decorations ) {
				const sh_in = item.description.indexOf('#')
                                if ( sh_in >=8 && sh_in < 16 ){
                                	const u_id = item.description.substr( 0,sh_in );

//					const owner = await this.usersRepository.findOneByOrFail({ id: u_id });
					const owner = await this.usersRepository.findOneBy({ id: u_id });
					let byName = '';
					if( owner ){
						if ( owner.name ){
							byName = owner.name;
						}else{
							byName = owner.username;
						}
					}
					if ( byName != '' ){
						while ( byName.includes(':')){
							const st_i = byName.indexOf(':');
							const ed_i = byName.indexOf(':',st_i + 1);
							let bname  = byName.substr( 0 , st_i );
							if ( ed_i > 0 ){
								byName = bname + byName.substr(ed_i + 1);
							}else{
								byName = bname;
							}
						}
						item.name = item.name + "/" + byName + "さん";
					}
                                }
			}

			return decorations.map(decoration => ({
				id: decoration.id,
				name: decoration.name,
				description: decoration.description,
				url: decoration.url,
				roleIdsThatCanBeUsedThisDecoration: decoration.roleIdsThatCanBeUsedThisDecoration.filter(roleId => allRoles.some(role => role.id === roleId)),
			}));
		});
	}
}
