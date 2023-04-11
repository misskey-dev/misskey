import { Injectable } from '@nestjs/common';
import type Bull from 'bull';

import { UserFollowingService } from '@/core/UserFollowingService.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { bindThis } from '@/decorators.js';
import type Logger from '@/logger.js';

import { QueueLoggerService } from '../QueueLoggerService.js';
import { RelationshipJobData } from '../types.js';

@Injectable()
export class RelationshipProcessorService {
	private logger: Logger;

	constructor(
		private queueLoggerService: QueueLoggerService,
		private userFollowingService: UserFollowingService,
		private userBlockingService: UserBlockingService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('follow-block');
	}

	@bindThis
	public async processFollow(job: Bull.Job<RelationshipJobData>): Promise<string> {
		this.logger.info(`${job.data.from.id} is trying to follow ${job.data.to.id}`);
		await this.userFollowingService.follow(job.data.from, job.data.to, job.data.requestId, job.data.silent);
		return 'ok';
	}

	@bindThis
	public async processUnfollow(job: Bull.Job<RelationshipJobData>): Promise<string> {
		this.logger.info(`${job.data.from.id} is trying to unfollow ${job.data.to.id}`);
		await this.userFollowingService.unfollow(job.data.from, job.data.to, job.data.silent);
		return 'ok';
	}

	@bindThis
	public async processBlock(job: Bull.Job<RelationshipJobData>): Promise<string> {
		this.logger.info(`${job.data.from.id} is trying to block ${job.data.to.id}`);
		await this.userBlockingService.block(job.data.from, job.data.to, job.data.silent);
		return 'ok';
	}

	@bindThis
	public async processUnblock(job: Bull.Job<RelationshipJobData>): Promise<string> {
		this.logger.info(`${job.data.from.id} is trying to unblock ${job.data.to.id}`);
		await this.userBlockingService.unblock(job.data.from, job.data.to);
		return 'ok';
	}
}
