/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageAvatarDecorations',
	kind: 'write:admin:avatar-decorations',

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', minLength: 1 },
		description: { type: 'string' },
		url: { type: 'string', minLength: 1 },
		roleIdsThatCanBeUsedThisDecoration: { type: 'array', items: {
			type: 'string',
		} },
	},
	required: ['id'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private avatarDecorationService: AvatarDecorationService,
	) {

		super(meta, paramDef, async (ps, me) => {

			const decoration = await  this.avatarDecorationService.getAvatarDecorationById(ps.id);
			if ( decoration != null ){
				let old_id = '';
				let sh_i = decoration.description.indexOf('#')
				if ( sh_i >=8 && sh_i < 16 ){
					old_id = decoration.description.substr( 0, sh_i );
				}
				let new_description = ps.description;
				let sh_in = new_description.indexOf('# ')
				if ( sh_in >=8 && sh_in < 16 ){
					new_description = new_description.substr( sh_in + 2 );
				} else{
					sh_in = new_description.indexOf('#')
					if ( sh_in >=8 && sh_in < 16 ){
						new_description = new_description.substr( sh_in + 1 );
					}
				}
				if ( old_id != '' ){
					new_description = old_id + '# ' + new_description;
				}

				await this.avatarDecorationService.update(ps.id, {
					name: decoration.name,
					description: new_description,
					url: ps.url,
					roleIdsThatCanBeUsedThisDecoration: ps.roleIdsThatCanBeUsedThisDecoration,
				}, me);
			}
		});
	}
}
