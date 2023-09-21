import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RolesRepository } from '@/models/index.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { RoleEntityService } from '@/core/entities/RoleEntityService.js';

export const meta = {
	tags: ['admin', 'role'],

	requireCredential: true,
	requireAdmin: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		description: { type: 'string' },
		color: { type: 'string', nullable: true },
		iconUrl: { type: 'string', nullable: true },
		target: { type: 'string', enum: ['manual', 'conditional'] },
		condFormula: { type: 'object' },
		isPublic: { type: 'boolean' },
		isModerator: { type: 'boolean' },
		isAdministrator: { type: 'boolean' },
		asBadge: { type: 'boolean' },
		canEditMembersByModerator: { type: 'boolean' },
		displayOrder: { type: 'number' },
		policies: {
			type: 'object',
		},
	},
	required: [
		'name',
		'description',
		'color',
		'iconUrl',
		'target',
		'condFormula',
		'isPublic',
		'isModerator',
		'isAdministrator',
		'asBadge',
		'canEditMembersByModerator',
		'displayOrder',
		'policies',
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
		private roleEntityService: RoleEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const date = new Date();
			const created = await this.rolesRepository.insert({
				id: this.idService.genId(),
				createdAt: date,
				updatedAt: date,
				lastUsedAt: date,
				name: ps.name,
				description: ps.description,
				color: ps.color,
				iconUrl: ps.iconUrl,
				target: ps.target,
				condFormula: ps.condFormula,
				isPublic: ps.isPublic,
				isAdministrator: ps.isAdministrator,
				isModerator: ps.isModerator,
				asBadge: ps.asBadge,
				canEditMembersByModerator: ps.canEditMembersByModerator,
				displayOrder: ps.displayOrder,
				policies: ps.policies,
			}).then(x => this.rolesRepository.findOneByOrFail(x.identifiers[0]));
	
			this.globalEventService.publishInternalEvent('roleCreated', created);

			return await this.roleEntityService.pack(created, me);
		});
	}
}
