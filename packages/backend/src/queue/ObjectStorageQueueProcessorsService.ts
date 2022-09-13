import { Inject, Injectable } from '@nestjs/common';
import type { ObjectStorageJobData } from '@/queue/types.js';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Config } from '@/config/types.js';
import type { CleanRemoteFilesProcessorService } from './processors/CleanRemoteFilesProcessorService.js';
import type { DeleteFileProcessorService } from './processors/DeleteFileProcessorService.js';
import type Bull from 'bull';

@Injectable()
export class ObjectStorageQueueProcessorsService {
	constructor(
		@Inject(DI_SYMBOLS.config)
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
