import { Inject, Injectable } from '@nestjs/common';
import { In, LessThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { AntennasRepository, MutedNotesRepository, RoleAssignmentsRepository, UserIpsRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';

@Injectable()
export class CleanProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.userIpsRepository)
		private userIpsRepository: UserIpsRepository,

		@Inject(DI.mutedNotesRepository)
		private mutedNotesRepository: MutedNotesRepository,

		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		@Inject(DI.roleAssignmentsRepository)
		private roleAssignmentsRepository: RoleAssignmentsRepository,

		private queueLoggerService: QueueLoggerService,
		private idService: IdService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('clean');
	}

	@bindThis
	public async process(job: Bull.Job<Record<string, unknown>>, done: () => void): Promise<void> {
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
		done();
	}
}
