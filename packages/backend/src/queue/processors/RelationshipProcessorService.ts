/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { UserFollowingService } from '@/core/UserFollowingService.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { bindThis } from '@/decorators.js';
import type Logger from '@/logger.js';

import type { UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { MiLocalUser, MiRemoteUser } from '@/models/User.js';
import { RelationshipJobData } from '../types.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import { IdentifiableError } from '@/misc/identifiable-error.js';

@Injectable()
export class RelationshipProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private queueLoggerService: QueueLoggerService,
		private userFollowingService: UserFollowingService,
		private userBlockingService: UserBlockingService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('follow-block');
	}

	@bindThis
	public async processFollow(job: Bull.Job<RelationshipJobData>): Promise<string> {
		this.logger.info(`${job.data.from.id} is trying to follow ${job.data.to.id} ${job.data.withReplies ? "with replies" : "without replies"}`);
		await this.userFollowingService.follow(job.data.from, job.data.to, {
			requestId: job.data.requestId,
			silent: job.data.silent,
			withReplies: job.data.withReplies,
		});
		return 'ok';
	}

	@bindThis
	public async processUnfollow(job: Bull.Job<RelationshipJobData>): Promise<string> {
		this.logger.info(`${job.data.from.id} is trying to unfollow ${job.data.to.id}`);
		const [follower, followee] = await Promise.all([
			this.usersRepository.findOneByOrFail({ id: job.data.from.id }),
			this.usersRepository.findOneByOrFail({ id: job.data.to.id }),
		]) as [MiLocalUser | MiRemoteUser, MiLocalUser | MiRemoteUser];
		await this.userFollowingService.unfollow(follower, followee, job.data.silent).catch((err) => {
			if (err instanceof IdentifiableError && err.id === '19f25f61-0141-4683-99dc-217a88d633cb') {
				// フォロー解除できないユーザー。動作は正常のため、エラーを無視する
				return;
			}
			throw err;
		});
		return 'ok';
	}

	@bindThis
	public async processBlock(job: Bull.Job<RelationshipJobData>): Promise<string> {
		this.logger.info(`${job.data.from.id} is trying to block ${job.data.to.id}`);
		const [blockee, blocker] = await Promise.all([
			this.usersRepository.findOneByOrFail({ id: job.data.from.id }),
			this.usersRepository.findOneByOrFail({ id: job.data.to.id }),
		]);
		await this.userBlockingService.block(blockee, blocker, job.data.silent).catch((err) => {
			if (err instanceof IdentifiableError && err.id === 'e2f04d25-0d94-4ac3-a4d8-ba401062741b') {
				// フォロー解除できない（＝ブロックもできない）ユーザー。動作は正常のため、エラーを無視する
				return;
			}
			throw err;
		});
		return 'ok';
	}

	@bindThis
	public async processUnblock(job: Bull.Job<RelationshipJobData>): Promise<string> {
		this.logger.info(`${job.data.from.id} is trying to unblock ${job.data.to.id}`);
		const [blockee, blocker] = await Promise.all([
			this.usersRepository.findOneByOrFail({ id: job.data.from.id }),
			this.usersRepository.findOneByOrFail({ id: job.data.to.id }),
		]);
		await this.userBlockingService.unblock(blockee, blocker);
		return 'ok';
	}
}
