import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RolesRepository } from '@/models/_.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['role'],

	requireCredential: true,
	kind: 'write:community-role',
	secure: true,

	errors: {
		noSuchRole: {
			message: 'No such role.',
			code: 'NO_SUCH_ROLE',
			id: 'cd23ef55-09ad-428a-ac61-95a45e124b32',
		},
		accessDenied: {
			message: 'Only administrators can edit of the role.',
			code: 'ACCESS_DENIED',
			id: '4266f6c5-8745-44e9-8fb8-7d464085c724',
		},
		notOwnerOrpermissionDenied: {
			message: 'You are not this role owner.',
			code: 'NOT_OWNER_OR_PERMISSION_DENIED',
			id: '73952b00-d3e3-4038-b2c6-f4b4532e3906',
		},
		emptyName: {
			message: 'Name is empty.',
			code: 'EMPTY_NAME',
			id: 'e787f7ba-a46c-46ef-a6dc-44b98e499e62',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		roleId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string' },
		description: { type: 'string' },
		color: { type: 'string', nullable: true },
		iconUrl: { type: 'string', nullable: true },
		asBadge: { type: 'boolean' },
		isPublic: { type: 'boolean' },
		isExplorable: { type: 'boolean' },
	},
	required: [
		'roleId',
		'name',
		'description',
		'color',
		'iconUrl',
		'asBadge',
		'isPublic',
		'isExplorable',
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.name.trim().length === 0) throw new ApiError(meta.errors.emptyName);

			const role = await this.rolesRepository.findOneBy({ id: ps.roleId });
			if (role == null) {
				throw new ApiError(meta.errors.noSuchRole);
			}

			if (role.permissionGroup !== 'Community') {
				throw new ApiError(meta.errors.accessDenied);
			}
			if (role.userId != null && role.userId !== me.id) {
				throw new ApiError(meta.errors.notOwnerOrpermissionDenied);
			}

			const date = new Date();
			await this.rolesRepository.update(ps.roleId, {
				updatedAt: date,
				name: ps.name,
				description: ps.description,
				color: ps.color,
				iconUrl: ps.iconUrl,
				asBadge: ps.asBadge,
				isPublic: ps.isPublic,
				isExplorable: ps.isExplorable,
			});
			const updated = await this.rolesRepository.findOneByOrFail({ id: ps.roleId });
			this.globalEventService.publishInternalEvent('roleUpdated', updated);
		});
	}
}
