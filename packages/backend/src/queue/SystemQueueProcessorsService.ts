import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { TickChartsProcessorService } from './processors/TickChartsProcessorService.js';
import type { ResyncChartsProcessorService } from './processors/ResyncChartsProcessorService.js';
import type { CleanChartsProcessorService } from './processors/CleanChartsProcessorService.js';
import type { CheckExpiredMutingsProcessorService } from './processors/CheckExpiredMutingsProcessorService.js';
import type { CleanProcessorService } from './processors/CleanProcessorService.js';
import type Bull from 'bull';

@Injectable()
export class SystemQueueProcessorsService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private tickChartsProcessorService: TickChartsProcessorService,
		private resyncChartsProcessorService: ResyncChartsProcessorService,
		private cleanChartsProcessorService: CleanChartsProcessorService,
		private checkExpiredMutingsProcessorService: CheckExpiredMutingsProcessorService,
		private cleanProcessorService: CleanProcessorService,
	) {
	}

	public start(dbQueue: Bull.Queue<Record<string, unknown>>) {
		const jobs = {
			tickCharts: this.tickChartsProcessorService.process,
			resyncCharts: this.resyncChartsProcessorService.process,
			cleanCharts: this.cleanChartsProcessorService.process,
			checkExpiredMutings: this.checkExpiredMutingsProcessorService.process,
			clean: this.cleanProcessorService.process,
		} as Record<string, Bull.ProcessCallbackFunction<Record<string, unknown>> | Bull.ProcessPromiseFunction<Record<string, unknown>>>;
		
		for (const [k, v] of Object.entries(jobs)) {
			dbQueue.process(k, v);
		}
	}
}
