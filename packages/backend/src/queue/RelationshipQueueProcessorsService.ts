import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import { RelationshipProcessorService } from './processors/RelationshipProcessorService.js';
import type Bull from 'bull';

@Injectable()
export class RelationshipQueueProcessorsService {
	constructor(
		private relationshipProcessorService: RelationshipProcessorService,
	) {
	}

	@bindThis
	public start(q: Bull.Queue): void {
		q.process('follow', (job) => this.relationshipProcessorService.processFollow(job));
		q.process('unfollow', (job) => this.relationshipProcessorService.processUnfollow(job));
		q.process('block', (job) => this.relationshipProcessorService.processBlock(job));
		q.process('unblock', (job) => this.relationshipProcessorService.processUnblock(job));
	}
}
