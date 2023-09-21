import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { DriveFilesRepository, FollowingsRepository, UsersRepository, NotesRepository } from '@/models/index.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import type { Note } from '@/models/entities/Note.js';
import { AppLockService } from '@/core/AppLockService.js';
import { DI } from '@/di-symbols.js';
import { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import Chart from '../core.js';
import { ChartLoggerService } from '../ChartLoggerService.js';
import { name, schema } from './entities/instance.js';
import type { KVs } from '../core.js';

/**
 * インスタンスごとのチャート
 */
// eslint-disable-next-line import/no-default-export
@Injectable()
export default class InstanceChart extends Chart<typeof schema> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private utilityService: UtilityService,
		private appLockService: AppLockService,
		private chartLoggerService: ChartLoggerService,
	) {
		super(db, (k) => appLockService.getChartInsertLock(k), chartLoggerService.logger, name, schema, true);
	}

	protected async tickMajor(group: string): Promise<Partial<KVs<typeof schema>>> {
		const [
			notesCount,
			usersCount,
			followingCount,
			followersCount,
			driveFiles,
		] = await Promise.all([
			this.notesRepository.countBy({ userHost: group }),
			this.usersRepository.countBy({ host: group }),
			this.followingsRepository.countBy({ followerHost: group }),
			this.followingsRepository.countBy({ followeeHost: group }),
			this.driveFilesRepository.countBy({ userHost: group }),
		]);

		return {
			'notes.total': notesCount,
			'users.total': usersCount,
			'following.total': followingCount,
			'followers.total': followersCount,
			'drive.totalFiles': driveFiles,
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async requestReceived(host: string): Promise<void> {
		await this.commit({
			'requests.received': 1,
		}, this.utilityService.toPuny(host));
	}

	@bindThis
	public async requestSent(host: string, isSucceeded: boolean): Promise<void> {
		await this.commit({
			'requests.succeeded': isSucceeded ? 1 : 0,
			'requests.failed': isSucceeded ? 0 : 1,
		}, this.utilityService.toPuny(host));
	}

	@bindThis
	public async newUser(host: string): Promise<void> {
		await this.commit({
			'users.total': 1,
			'users.inc': 1,
		}, this.utilityService.toPuny(host));
	}

	@bindThis
	public async updateNote(host: string, note: Note, isAdditional: boolean): Promise<void> {
		await this.commit({
			'notes.total': isAdditional ? 1 : -1,
			'notes.inc': isAdditional ? 1 : 0,
			'notes.dec': isAdditional ? 0 : 1,
			'notes.diffs.normal': note.replyId == null && note.renoteId == null ? (isAdditional ? 1 : -1) : 0,
			'notes.diffs.renote': note.renoteId != null ? (isAdditional ? 1 : -1) : 0,
			'notes.diffs.reply': note.replyId != null ? (isAdditional ? 1 : -1) : 0,
			'notes.diffs.withFile': note.fileIds.length > 0 ? (isAdditional ? 1 : -1) : 0,
		}, this.utilityService.toPuny(host));
	}

	@bindThis
	public async updateFollowing(host: string, isAdditional: boolean): Promise<void> {
		await this.commit({
			'following.total': isAdditional ? 1 : -1,
			'following.inc': isAdditional ? 1 : 0,
			'following.dec': isAdditional ? 0 : 1,
		}, this.utilityService.toPuny(host));
	}

	@bindThis
	public async updateFollowers(host: string, isAdditional: boolean): Promise<void> {
		await this.commit({
			'followers.total': isAdditional ? 1 : -1,
			'followers.inc': isAdditional ? 1 : 0,
			'followers.dec': isAdditional ? 0 : 1,
		}, this.utilityService.toPuny(host));
	}

	@bindThis
	public async updateDrive(file: DriveFile, isAdditional: boolean): Promise<void> {
		const fileSizeKb = file.size / 1000;
		await this.commit({
			'drive.totalFiles': isAdditional ? 1 : -1,
			'drive.incFiles': isAdditional ? 1 : 0,
			'drive.incUsage': isAdditional ? fileSizeKb : 0,
			'drive.decFiles': isAdditional ? 1 : 0,
			'drive.decUsage': isAdditional ? fileSizeKb : 0,
		}, file.userHost);
	}
}
