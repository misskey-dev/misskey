import { Inject, Injectable } from '@nestjs/common';
import type { ObjectStorageJobData } from '@/queue/types.js';
import { DI } from '@/di-symbols.js';
import { Config } from '@/config.js';
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
			deleteFile: this.deleteFileProcessorService.process,
			cleanRemoteFiles: this.cleanRemoteFilesProcessorService.process,
		} as Record<string, Bull.ProcessCallbackFunction<ObjectStorageJobData | Bull.ProcessPromiseFunction<ObjectStorageJobData>>>;
		
		for (const [k, v] of Object.entries(jobs)) {
			q.process(k, 16, v);
		}
	}
}
