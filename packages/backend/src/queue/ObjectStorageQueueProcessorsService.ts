import { Inject, Injectable } from '@nestjs/common';
import type { ObjectStorageJobData } from '@/queue/types.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { CleanRemoteFilesProcessorService } from './processors/CleanRemoteFilesProcessorService.js';
import { DeleteFileProcessorService } from './processors/DeleteFileProcessorService.js';
import type Bull from 'bull';

@Injectable()
export class ObjectStorageQueueProcessorsService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private deleteFileProcessorService: DeleteFileProcessorService,
		private cleanRemoteFilesProcessorService: CleanRemoteFilesProcessorService,
	) {
	}

	public start(q: Bull.Queue) {
		const jobs = {
			deleteFile: (job, done) => this.deleteFileProcessorService.process(job, done),
			cleanRemoteFiles: (job, done) => this.cleanRemoteFilesProcessorService.process(job, done),
		} as Record<string, Bull.ProcessCallbackFunction<ObjectStorageJobData | Bull.ProcessPromiseFunction<ObjectStorageJobData>>>;
		
		for (const [k, v] of Object.entries(jobs)) {
			q.process(k, 16, v);
		}
	}
}
