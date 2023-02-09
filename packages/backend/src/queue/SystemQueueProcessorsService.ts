import { Inject, Injectable } from '@/di-decorators.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';
import { TickChartsProcessorService } from './processors/TickChartsProcessorService.js';
import { ResyncChartsProcessorService } from './processors/ResyncChartsProcessorService.js';
import { CleanChartsProcessorService } from './processors/CleanChartsProcessorService.js';
import { CheckExpiredMutingsProcessorService } from './processors/CheckExpiredMutingsProcessorService.js';
import { CleanProcessorService } from './processors/CleanProcessorService.js';
import { AggregateRetentionProcessorService } from './processors/AggregateRetentionProcessorService.js';
import type Bull from 'bull';

@Injectable()
export class SystemQueueProcessorsService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.TickChartsProcessorService)
		private tickChartsProcessorService: TickChartsProcessorService,

		@Inject(DI.ResyncChartsProcessorService)
		private resyncChartsProcessorService: ResyncChartsProcessorService,

		@Inject(DI.CleanChartsProcessorService)
		private cleanChartsProcessorService: CleanChartsProcessorService,

		@Inject(DI.AggregateRetentionProcessorService)
		private aggregateRetentionProcessorService: AggregateRetentionProcessorService,

		@Inject(DI.CheckExpiredMutingsProcessorService)
		private checkExpiredMutingsProcessorService: CheckExpiredMutingsProcessorService,

		@Inject(DI.CleanProcessorService)
		private cleanProcessorService: CleanProcessorService,
	) {
	}

	@bindThis
	public start(q: Bull.Queue): void {
		q.process('tickCharts', (job, done) => this.tickChartsProcessorService.process(job, done));
		q.process('resyncCharts', (job, done) => this.resyncChartsProcessorService.process(job, done));
		q.process('cleanCharts', (job, done) => this.cleanChartsProcessorService.process(job, done));
		q.process('aggregateRetention', (job, done) => this.aggregateRetentionProcessorService.process(job, done));
		q.process('checkExpiredMutings', (job, done) => this.checkExpiredMutingsProcessorService.process(job, done));
		q.process('clean', (job, done) => this.cleanProcessorService.process(job, done));
	}
}
