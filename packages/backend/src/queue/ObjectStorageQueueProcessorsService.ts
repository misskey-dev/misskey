import { Inject, Injectable } from '@/di-decorators.js';
import type { ObjectStorageJobData } from '@/queue/types.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { CleanRemoteFilesProcessorService } from './processors/CleanRemoteFilesProcessorService.js';
import { DeleteFileProcessorService } from './processors/DeleteFileProcessorService.js';
import type Bull from 'bull';
import { bindThis } from '@/decorators.js';

@Injectable()
export class ObjectStorageQueueProcessorsService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.DeleteFileProcessorService)
		private deleteFileProcessorService: DeleteFileProcessorService,

		@Inject(DI.CleanRemoteFilesProcessorService)
		private cleanRemoteFilesProcessorService: CleanRemoteFilesProcessorService,
	) {
	}

	@bindThis
	public start(q: Bull.Queue): void {
		q.process('deleteFile', 16, (job) => this.deleteFileProcessorService.process(job));
		q.process('cleanRemoteFiles', 16, (job, done) => this.cleanRemoteFilesProcessorService.process(job, done));
	}
}
