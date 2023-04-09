import { Inject, Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import { RelationshipProcessorService } from './processors/RelationshipProcessorService.js';
import type Bull from 'bull';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';

@Injectable()
export class RelationshipQueueProcessorsService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private relationshipProcessorService: RelationshipProcessorService,
	) {
	}

	@bindThis
	public start(q: Bull.Queue): void {
		const maxJobs = (this.config.deliverJobConcurrency ?? 128) / 4; // conservative?
		q.process('follow', maxJobs, (job) => this.relationshipProcessorService.processFollow(job));
		q.process('unfollow', maxJobs, (job) => this.relationshipProcessorService.processUnfollow(job));
		q.process('block', maxJobs, (job) => this.relationshipProcessorService.processBlock(job));
		q.process('unblock', maxJobs, (job) => this.relationshipProcessorService.processUnblock(job));
	}
}
