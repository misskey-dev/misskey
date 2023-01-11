import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RolesRepository } from '@/models/index.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	rolePermission: 'createRole',
} as const;

const optionValue = {
	type: 'object',
	properties: {
		useDefault: { type: 'boolean' },
		value: { },
	},
	required: [
		'useDefault',
		'value',
	],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		description: { type: 'string' },
		isPublic: { type: 'boolean' },
		option_userSuspend: optionValue,
		option_userSilence: optionValue,
		option_createRole: optionValue,
		option_readRole: optionValue,
		option_updateRole: optionValue,
		option_deleteRole: optionValue,
		option_assignRole: optionValue,
		option_antennaLimit: optionValue,
	},
	required: [
		'name',
		'description',
		'isPublic',
		'option_userSuspend',
		'option_userSilence',
		'option_createRole',
		'option_readRole',
		'option_updateRole',
		'option_deleteRole',
		'option_assignRole',
		'option_antennaLimit',
	],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		private globalEventService: GlobalEventService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps) => {
			const date = new Date();
			await this.rolesRepository.insert({
				id: this.idService.genId(),
				createdAt: date,
				updatedAt: date,
				name: ps.name,
				description: ps.description,
				isPublic: ps.isPublic,
				option_userSuspend: ps.option_userSuspend,
				option_userSilence: ps.option_userSilence,
				option_createRole: ps.option_createRole,
				option_readRole: ps.option_readRole,
				option_updateRole: ps.option_updateRole,
				option_deleteRole: ps.option_deleteRole,
				option_assignRole: ps.option_assignRole,
				option_antennaLimit: ps.option_antennaLimit,
			});
		});
	}
}
