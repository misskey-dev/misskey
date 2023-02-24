import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';
import { DeleteDriveFilesProcessorService } from './processors/DeleteDriveFilesProcessorService.js';
import { ExportCustomEmojisProcessorService } from './processors/ExportCustomEmojisProcessorService.js';
import { ExportNotesProcessorService } from './processors/ExportNotesProcessorService.js';
import { ExportFollowingProcessorService } from './processors/ExportFollowingProcessorService.js';
import { ExportMutingProcessorService } from './processors/ExportMutingProcessorService.js';
import { ExportBlockingProcessorService } from './processors/ExportBlockingProcessorService.js';
import { ExportUserListsProcessorService } from './processors/ExportUserListsProcessorService.js';
import { ImportFollowingProcessorService } from './processors/ImportFollowingProcessorService.js';
import { ImportMutingProcessorService } from './processors/ImportMutingProcessorService.js';
import { ImportBlockingProcessorService } from './processors/ImportBlockingProcessorService.js';
import { ImportUserListsProcessorService } from './processors/ImportUserListsProcessorService.js';
import { ImportCustomEmojisProcessorService } from './processors/ImportCustomEmojisProcessorService.js';
import { DeleteAccountProcessorService } from './processors/DeleteAccountProcessorService.js';
import { ExportFavoritesProcessorService } from './processors/ExportFavoritesProcessorService.js';
import type Bull from 'bull';

@Injectable()
export class DbQueueProcessorsService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private deleteDriveFilesProcessorService: DeleteDriveFilesProcessorService,
		private exportCustomEmojisProcessorService: ExportCustomEmojisProcessorService,
		private exportNotesProcessorService: ExportNotesProcessorService,
		private exportFavoritesProcessorService: ExportFavoritesProcessorService,
		private exportFollowingProcessorService: ExportFollowingProcessorService,
		private exportMutingProcessorService: ExportMutingProcessorService,
		private exportBlockingProcessorService: ExportBlockingProcessorService,
		private exportUserListsProcessorService: ExportUserListsProcessorService,
		private importFollowingProcessorService: ImportFollowingProcessorService,
		private importMutingProcessorService: ImportMutingProcessorService,
		private importBlockingProcessorService: ImportBlockingProcessorService,
		private importUserListsProcessorService: ImportUserListsProcessorService,
		private importCustomEmojisProcessorService: ImportCustomEmojisProcessorService,
		private deleteAccountProcessorService: DeleteAccountProcessorService,
	) {
	}

	@bindThis
	public start(q: Bull.Queue): void {
		q.process('deleteDriveFiles', (job, done) => this.deleteDriveFilesProcessorService.process(job, done));
		q.process('exportCustomEmojis', (job, done) => this.exportCustomEmojisProcessorService.process(job, done));
		q.process('exportNotes', (job, done) => this.exportNotesProcessorService.process(job, done));
		q.process('exportFavorites', (job, done) => this.exportFavoritesProcessorService.process(job, done));
		q.process('exportFollowing', (job, done) => this.exportFollowingProcessorService.process(job, done));
		q.process('exportMuting', (job, done) => this.exportMutingProcessorService.process(job, done));
		q.process('exportBlocking', (job, done) => this.exportBlockingProcessorService.process(job, done));
		q.process('exportUserLists', (job, done) => this.exportUserListsProcessorService.process(job, done));
		q.process('importFollowing', (job, done) => this.importFollowingProcessorService.process(job, done));
		q.process('importMuting', (job, done) => this.importMutingProcessorService.process(job, done));
		q.process('importBlocking', (job, done) => this.importBlockingProcessorService.process(job, done));
		q.process('importUserLists', (job, done) => this.importUserListsProcessorService.process(job, done));
		q.process('importCustomEmojis', (job, done) => this.importCustomEmojisProcessorService.process(job, done));
		q.process('deleteAccount', (job) => this.deleteAccountProcessorService.process(job));
	}
}
