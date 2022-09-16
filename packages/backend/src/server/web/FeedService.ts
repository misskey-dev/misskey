import { Inject, Injectable } from '@nestjs/common';
import { In, IsNull } from 'typeorm';
import { Feed } from 'feed';
import { DI } from '@/di-symbols.js';
import type { DriveFiles, Notes, UserProfiles, Users } from '@/models/index.js';
import { Config } from '@/config.js';
import type { User } from '@/models/entities/User.js';
import { UserEntityService } from '@/services/entities/UserEntityService.js';
import { DriveFileEntityService } from '@/services/entities/DriveFileEntityService.js';

@Injectable()
export class FeedService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: typeof Users,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: typeof UserProfiles,

		@Inject(DI.notesRepository)
		private notesRepository: typeof Notes,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: typeof DriveFiles,

		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
	) {
	}

	public async packFeed(user: User) {
		const author = {
			link: `${this.config.url}/@${user.username}`,
			name: user.name ?? user.username,
		};
	
		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });
	
		const notes = await this.notesRepository.find({
			where: {
				userId: user.id,
				renoteId: IsNull(),
				visibility: In(['public', 'home']),
			},
			order: { createdAt: -1 },
			take: 20,
		});
	
		const feed = new Feed({
			id: author.link,
			title: `${author.name} (@${user.username}@${this.config.host})`,
			updated: notes[0].createdAt,
			generator: 'Misskey',
			description: `${user.notesCount} Notes, ${profile.ffVisibility === 'public' ? user.followingCount : '?'} Following, ${profile.ffVisibility === 'public' ? user.followersCount : '?'} Followers${profile.description ? ` · ${profile.description}` : ''}`,
			link: author.link,
			image: await this.userEntityService.getAvatarUrl(user),
			feedLinks: {
				json: `${author.link}.json`,
				atom: `${author.link}.atom`,
			},
			author,
			copyright: user.name ?? user.username,
		});
	
		for (const note of notes) {
			const files = note.fileIds.length > 0 ? await this.driveFilesRepository.findBy({
				id: In(note.fileIds),
			}) : [];
			const file = files.find(file => file.type.startsWith('image/'));
	
			feed.addItem({
				title: `New note by ${author.name}`,
				link: `${this.config.url}/notes/${note.id}`,
				date: note.createdAt,
				description: note.cw ?? undefined,
				content: note.text ?? undefined,
				image: file ? this.driveFileEntityService.getPublicUrl(file) ?? undefined : undefined,
			});
		}
	
		return feed;
	}
}
