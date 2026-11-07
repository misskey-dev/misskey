/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In, LessThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { AntennasRepository, RoleAssignmentsRepository, UserIpsRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import type { Config } from '@/config.js';
import { ReversiService } from '@/core/ReversiService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class CleanProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.userIpsRepository)
		private userIpsRepository: UserIpsRepository,

		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		@Inject(DI.roleAssignmentsRepository)
		private roleAssignmentsRepository: RoleAssignmentsRepository,

		private queueLoggerService: QueueLoggerService,
		private reversiService: ReversiService,
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

		// 使われてないアンテナを停止
		if (this.config.deactivateAntennaThreshold > 0) {
			this.antennasRepository.update({
				lastUsedAt: LessThan(new Date(Date.now() - this.config.deactivateAntennaThreshold)),
			}, {
				isActive: false,
			});
		}

		const expiredRoleAssignments = await this.roleAssignmentsRepository.createQueryBuilder('assign')
			.where('assign.expiresAt IS NOT NULL')
			.andWhere('assign.expiresAt < :now', { now: new Date() })
			.getMany();

		if (expiredRoleAssignments.length > 0) {
			await this.roleAssignmentsRepository.delete({
				id: In(expiredRoleAssignments.map(x => x.id)),
			});
		}

		this.reversiService.cleanOutdatedGames();

		this.logger.succ('Cleaned.');
	}
}
