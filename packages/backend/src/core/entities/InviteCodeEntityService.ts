/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { RegistrationTicketsRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { User } from '@/models/entities/User.js';
import type { RegistrationTicket } from '@/models/entities/RegistrationTicket.js';
import { bindThis } from '@/decorators.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class InviteCodeEntityService {
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: RegistrationTicket['id'] | RegistrationTicket,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'InviteCode'>> {
		const target = typeof src === 'object' ? src : await this.registrationTicketsRepository.findOneOrFail({
			where: {
				id: src,
			},
			relations: ['createdBy', 'usedBy'],
		});

		return await awaitAll({
			id: target.id,
			code: target.code,
			expiresAt: target.expiresAt ? target.expiresAt.toISOString() : null,
			createdAt: target.createdAt.toISOString(),
			createdBy: target.createdBy ? await this.userEntityService.pack(target.createdBy, me) : null,
			usedBy: target.usedBy ? await this.userEntityService.pack(target.usedBy, me) : null,
			usedAt: target.usedAt ? target.usedAt.toISOString() : null,
			used: !!target.usedAt,
		});
	}

	@bindThis
	public packMany(
		targets: any[],
		me: { id: User['id'] },
	) {
		return Promise.all(targets.map(x => this.pack(x, me)));
	}
}
