/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In, IsNull } from 'typeorm';
import { Feed } from 'feed';
import { DI } from '@/di-symbols.js';
import * as Acct from '@/misc/acct.js';
import type { DriveFilesRepository, NotesRepository, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import type { Config } from '@/config.js';
import type { MiUser } from '@/models/User.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { FunoutTimelineService } from '@/core/FunoutTimelineService.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export type FeedFormat = 'atom' | 'rss' | 'json';

@Injectable()
export class FeedService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
		private idService: IdService,
		private funoutTimelineService: FunoutTimelineService,
	) {
	}

	@bindThis
	private async packFeed(
		user: MiUser,
		options?: {
			withReplies?: boolean;
			withFiles?: boolean;
		},
	) {
		const opts = Object.assign({
			withReplies: false,
			withFiles: false,
		}, options);

		const author = {
			link: `${this.config.url}/@${user.username}`,
			name: user.name ?? user.username,
		};

		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

		let withFilesIds: string[] = [];
		if (opts.withFiles) {
			withFilesIds = await this.funoutTimelineService.get(`userTimelineWithFiles:${user.id}`);
		}

		const notes = await this.notesRepository.find({
			where: {
				userId: user.id,
				renoteId: IsNull(),
				visibility: In(['public', 'home']),
				...(opts.withReplies ? {} : {
					replyId: IsNull(),
				}),
				...(opts.withFiles ? {
					id: In(withFilesIds),
				} : {}),
			},
			order: { id: -1 },
			take: 20,
		});

		const optionLink = opts.withReplies ? '.with_replies' : opts.withFiles ? '.with_files' : '';

		const feed = new Feed({
			id: author.link,
			title: `${author.name} (@${user.username}@${this.config.host})`,
			updated: this.idService.parse(notes[0].id).date,
			generator: 'Misskey',
			description: `${user.notesCount} Notes, ${profile.ffVisibility === 'public' ? user.followingCount : '?'} Following, ${profile.ffVisibility === 'public' ? user.followersCount : '?'} Followers${profile.description ? ` · ${profile.description}` : ''}`,
			link: author.link,
			image: user.avatarUrl ?? this.userEntityService.getIdenticonUrl(user),
			feedLinks: {
				json: `${author.link + optionLink}.json`,
				atom: `${author.link + optionLink}.atom`,
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
				date: this.idService.parse(note.id).date,
				description: note.cw ?? undefined,
				content: note.text ?? undefined,
				image: file ? this.driveFileEntityService.getPublicUrl(file) : undefined,
			});
		}

		return feed;
	}

	@bindThis
	public handle(
		feedFormat: FeedFormat,
		options?: {
			withReplies?: boolean;
			withFiles?: boolean;
		},
	) {
		return async (
			request: FastifyRequest<{ Params: { user: string; } }>,
			reply: FastifyReply,
		) => {
			const { username, host } = Acct.parse(request.params.user);
			const user = await this.usersRepository.findOneBy({
				usernameLower: username.toLowerCase(),
				host: host ?? IsNull(),
				isSuspended: false,
			});

			const feed = user && await this.packFeed(user, options);

			if (feed) {
				const subtype = feedFormat === 'atom' || feedFormat === 'rss'
					? `${feedFormat}+xml`
					: feedFormat;

				reply.header('Content-Type', `application/${subtype}; charset=utf-8`);

				if (feedFormat === 'atom') return feed.atom1();
				else if (feedFormat === 'rss') return feed.rss2();
				else return feed.json1();
			} else {
				reply.code(404);
				return;
			}
		};
	}
}
