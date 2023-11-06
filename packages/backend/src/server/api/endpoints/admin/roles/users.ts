/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import type { RoleAssignmentsRepository, RolesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin', 'role', 'users'],

	requireCredential: false,
	requireAdmin: true,

	errors: {
		noSuchRole: {
			message: 'No such role.',
			code: 'NO_SUCH_ROLE',
			id: '224eff5e-2488-4b18-b3e7-f50d94421648',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		roleId: { type: 'string', format: 'misskey:id' },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	},
	required: ['roleId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		@Inject(DI.roleAssignmentsRepository)
		private roleAssignmentsRepository: RoleAssignmentsRepository,

		private queryService: QueryService,
		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const role = await this.rolesRepository.findOneBy({
				id: ps.roleId,
			});

			if (role == null) {
				throw new ApiError(meta.errors.noSuchRole);
			}

			const query = this.queryService.makePaginationQuery(this.roleAssignmentsRepository.createQueryBuilder('assign'), ps.sinceId, ps.untilId)
				.andWhere('assign.roleId = :roleId', { roleId: role.id })
				.andWhere(new Brackets(qb => {
					qb
						.where('assign.expiresAt IS NULL')
						.orWhere('assign.expiresAt > :now', { now: new Date() });
				}))
				.innerJoinAndSelect('assign.user', 'user');

			const assigns = await query
				.limit(ps.limit)
				.getMany();

			return await Promise.all(assigns.map(async assign => ({
				id: assign.id,
				createdAt: this.idService.parse(assign.id).date.toISOString(),
				user: await this.userEntityService.pack(assign.user!, me, { detail: true }),
				expiresAt: assign.expiresAt,
			})));
		});
	}
}
