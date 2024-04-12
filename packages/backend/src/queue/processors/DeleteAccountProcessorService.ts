/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository, MiUser, NotesRepository, UserProfilesRepository, UsersRepository, NirilaDeleteUserLogRepository, SigninsRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { DriveService } from '@/core/DriveService.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import type { MiNote } from '@/models/Note.js';
import { EmailService } from '@/core/EmailService.js';
import { bindThis } from '@/decorators.js';
import { SearchService } from '@/core/SearchService.js';
import { RoleService } from '@/core/RoleService.js';
import { RoleEntityService } from '@/core/entities/RoleEntityService.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { DbUserDeleteJobData } from '../types.js';

@Injectable()
export class DeleteAccountProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.nirilaDeleteUserLogRepository)
		private nirilaDeleteUserLogRepository: NirilaDeleteUserLogRepository,

		@Inject(DI.signinsRepository)
		private signinsRepository: SigninsRepository,

		private roleService: RoleService,
		private roleEntityService: RoleEntityService,
		private idService: IdService,
		private userEntityService: UserEntityService,

		private driveService: DriveService,
		private emailService: EmailService,
		private queueLoggerService: QueueLoggerService,
		private searchService: SearchService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('delete-account');
	}

	@bindThis
	async logDelete(user: MiUser) {
		if (user.host != null) {
			this.logger.info(`Skipping logging account deletion of ${user.id} ...`);
			return;
		}

		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

		// data from src/server/api/endpoints/users/show.ts
		const detailedUser = await this.userEntityService.pack<'UserDetailed'>(user, null, {
			schema: 'UserDetailed',
			asModerator: true,
		});

		// data from src/server/api/endpoints/admin/show-user.ts

		const isModerator = await this.roleService.isModerator(user);
		const isSilenced = !(await this.roleService.getUserPolicies(user.id)).canPublicNote;

		const signins = await this.signinsRepository.findBy({ userId: user.id });

		const roleAssigns = await this.roleService.getUserAssigns(user.id);
		const roles = await this.roleService.getUserRoles(user.id);

		const adminInfo = {
			email: profile.email,
			emailVerified: profile.emailVerified,
			autoAcceptFollowed: profile.autoAcceptFollowed,
			noCrawle: profile.noCrawle,
			preventAiLearning: profile.preventAiLearning,
			alwaysMarkNsfw: profile.alwaysMarkNsfw,
			autoSensitive: profile.autoSensitive,
			carefulBot: profile.carefulBot,
			injectFeaturedNote: profile.injectFeaturedNote,
			receiveAnnouncementEmail: profile.receiveAnnouncementEmail,
			mutedWords: profile.mutedWords,
			mutedInstances: profile.mutedInstances,
			notificationRecieveConfig: profile.notificationRecieveConfig,
			isModerator: isModerator,
			isSilenced: isSilenced,
			isSuspended: user.isSuspended,
			isHibernated: user.isHibernated,
			lastActiveDate: user.lastActiveDate,
			moderationNote: profile.moderationNote ?? '',
			signins,
			policies: await this.roleService.getUserPolicies(user.id),
			roles: await this.roleEntityService.packMany(roles, { id: user.id }), // note: me is unused param
			roleAssigns: roleAssigns.map(a => ({
				createdAt: this.idService.parse(a.id).date.toISOString(),
				expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
				roleId: a.roleId,
			})),
		};

		const info: Record<string, any> = {
			user: detailedUser,
			adminInfo,
		};

		await this.nirilaDeleteUserLogRepository.insert({
			id: this.idService.gen(),
			userId: user.id,
			username: user.username,
			email: profile.email,
			info,
		});

		this.logger.info(`Finished logging account deletion of ${user.id} ...`);
	}

	@bindThis
	public async process(job: Bull.Job<DbUserDeleteJobData>): Promise<string | void> {
		this.logger.info(`Deleting account of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		try {
			this.logDelete(user);
		} catch (e) {
			this.logger.error(`Failed to log delete: ${e}`);
		}

		{ // Delete notes
			let cursor: MiNote['id'] | null = null;

			while (true) {
				const notes = await this.notesRepository.find({
					where: {
						userId: user.id,
						...(cursor ? { id: MoreThan(cursor) } : {}),
					},
					take: 100,
					order: {
						id: 1,
					},
				}) as MiNote[];

				if (notes.length === 0) {
					break;
				}

				cursor = notes.at(-1)?.id ?? null;

				await this.notesRepository.delete(notes.map(note => note.id));

				for (const note of notes) {
					await this.searchService.unindexNote(note);
				}
			}

			this.logger.succ('All of notes deleted');
		}

		{ // Delete files
			let cursor: MiDriveFile['id'] | null = null;

			while (true) {
				const files = await this.driveFilesRepository.find({
					where: {
						userId: user.id,
						...(cursor ? { id: MoreThan(cursor) } : {}),
					},
					take: 10,
					order: {
						id: 1,
					},
				}) as MiDriveFile[];

				if (files.length === 0) {
					break;
				}

				cursor = files.at(-1)?.id ?? null;

				for (const file of files) {
					await this.driveService.deleteFileSync(file);
				}
			}

			this.logger.succ('All of files deleted');
		}

		{ // Send email notification
			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });
			if (profile.email && profile.emailVerified) {
				this.emailService.sendEmail(profile.email, 'Account deleted',
					'Your account has been deleted.',
					'Your account has been deleted.');
			}
		}

		// soft指定されている場合は物理削除しない
		if (job.data.soft) {
		// nop
		} else {
			await this.usersRepository.delete(job.data.user.id);
		}

		return 'Account deleted';
	}
}
