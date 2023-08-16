/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In, LessThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiAntennasRepository, MiMutedNotesRepository, MiRoleAssignmentsRepository, MiUserIpsRepository } from '@/models/index.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class CleanProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.userIpsRepository)
		private userIpsRepository: MiUserIpsRepository,

		@Inject(DI.mutedNotesRepository)
		private mutedNotesRepository: MiMutedNotesRepository,

		@Inject(DI.antennasRepository)
		private antennasRepository: MiAntennasRepository,

		@Inject(DI.roleAssignmentsRepository)
		private roleAssignmentsRepository: MiRoleAssignmentsRepository,

		private queueLoggerService: QueueLoggerService,
		private idService: IdService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('clean');
	}

	@bindThis
	public async process(): Promise<void> {
		this.logger.info('Cleaning...');

		this.userIpsRepository.delete({
			createdAt: LessThan(new Date(Date.now() - (1000 * 60 * 60 * 24 * 90))),
		});

		this.mutedNotesRepository.delete({
			id: LessThan(this.idService.genId(new Date(Date.now() - (1000 * 60 * 60 * 24 * 90)))),
			reason: 'word',
		});

		this.mutedNotesRepository.delete({
			id: LessThan(this.idService.genId(new Date(Date.now() - (1000 * 60 * 60 * 24 * 90)))),
			reason: 'word',
		});

		// 7日以上使われてないアンテナを停止
		this.antennasRepository.update({
			lastUsedAt: LessThan(new Date(Date.now() - (1000 * 60 * 60 * 24 * 7))),
		}, {
			isActive: false,
		});

		const expiredRoleAssignments = await this.roleAssignmentsRepository.createQueryBuilder('assign')
			.where('assign.expiresAt IS NOT NULL')
			.andWhere('assign.expiresAt < :now', { now: new Date() })
			.getMany();

		if (expiredRoleAssignments.length > 0) {
			await this.roleAssignmentsRepository.delete({
				id: In(expiredRoleAssignments.map(x => x.id)),
			});
		}

		this.logger.succ('Cleaned.');
	}
}
