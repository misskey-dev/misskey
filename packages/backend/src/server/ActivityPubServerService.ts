import { Inject, Injectable } from '@nestjs/common';
import Router from '@koa/router';
import json from 'koa-json-body';
import httpSignature from '@peertube/http-signature';
import { Brackets, In, IsNull, LessThan, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { FollowingsRepository, NotesRepository, EmojisRepository, NoteReactionsRepository, UserProfilesRepository, UserNotePiningsRepository, UsersRepository } from '@/models/index.js';
import * as url from '@/misc/prelude/url.js';
import type { Config } from '@/config.js';
import { ApRendererService } from '@/core/remote/activitypub/ApRendererService.js';
import { QueueService } from '@/core/QueueService.js';
import type { ILocalUser, User } from '@/models/entities/User.js';
import { UserKeypairStoreService } from '@/core/UserKeypairStoreService.js';
import type { Following } from '@/models/entities/Following.js';
import { countIf } from '@/misc/prelude/array.js';
import type { Note } from '@/models/entities/Note.js';
import { QueryService } from '@/core/QueryService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import type { FindOptionsWhere } from 'typeorm';

const ACTIVITY_JSON = 'application/activity+json; charset=utf-8';
const LD_JSON = 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"; charset=utf-8';

@Injectable()
export class ActivityPubServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		@Inject(DI.userNotePiningsRepository)
		private userNotePiningsRepository: UserNotePiningsRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private utilityService: UtilityService,
		private userEntityService: UserEntityService,
		private apRendererService: ApRendererService,
		private queueService: QueueService,
		private userKeypairStoreService: UserKeypairStoreService,
		private queryService: QueryService,
	) {
	}

	private setResponseType(ctx: Router.RouterContext) {
		const accept = ctx.accepts(ACTIVITY_JSON, LD_JSON);
		if (accept === LD_JSON) {
			ctx.response.type = LD_JSON;
		} else {
			ctx.response.type = ACTIVITY_JSON;
		}
	}

	/**
	 * Pack Create<Note> or Announce Activity
	 * @param note Note
	 */
	private async packActivity(note: Note): Promise<any> {
		if (note.renoteId && note.text == null && !note.hasPoll && (note.fileIds == null || note.fileIds.length === 0)) {
			const renote = await this.notesRepository.findOneByOrFail({ id: note.renoteId });
			return this.apRendererService.renderAnnounce(renote.uri ? renote.uri : `${this.config.url}/notes/${renote.id}`, note);
		}

		return this.apRendererService.renderCreate(await this.apRendererService.renderNote(note, false), note);
	}

	private inbox(ctx: Router.RouterContext) {
		let signature;

		try {
			signature = httpSignature.parseRequest(ctx.req, { 'headers': [] });
		} catch (e) {
			ctx.status = 401;
			return;
		}

		this.queueService.inbox(ctx.request.body, signature);

		ctx.status = 202;
	}

	private async followers(ctx: Router.RouterContext) {
		const userId = ctx.params.user;

		const cursor = ctx.request.query.cursor;
		if (cursor != null && typeof cursor !== 'string') {
			ctx.status = 400;
			return;
		}

		const page = ctx.request.query.page === 'true';

		const user = await this.usersRepository.findOneBy({
			id: userId,
			host: IsNull(),
		});

		if (user == null) {
			ctx.status = 404;
			return;
		}

		//#region Check ff visibility
		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

		if (profile.ffVisibility === 'private') {
			ctx.status = 403;
			ctx.set('Cache-Control', 'public, max-age=30');
			return;
		} else if (profile.ffVisibility === 'followers') {
			ctx.status = 403;
			ctx.set('Cache-Control', 'public, max-age=30');
			return;
		}
		//#endregion

		const limit = 10;
		const partOf = `${this.config.url}/users/${userId}/followers`;

		if (page) {
			const query = {
				followeeId: user.id,
			} as FindOptionsWhere<Following>;

			// カーソルが指定されている場合
			if (cursor) {
				query.id = LessThan(cursor);
			}

			// Get followers
			const followings = await this.followingsRepository.find({
				where: query,
				take: limit + 1,
				order: { id: -1 },
			});

			// 「次のページ」があるかどうか
			const inStock = followings.length === limit + 1;
			if (inStock) followings.pop();

			const renderedFollowers = await Promise.all(followings.map(following => this.apRendererService.renderFollowUser(following.followerId)));
			const rendered = this.apRendererService.renderOrderedCollectionPage(
				`${partOf}?${url.query({
					page: 'true',
					cursor,
				})}`,
				user.followersCount, renderedFollowers, partOf,
				undefined,
				inStock ? `${partOf}?${url.query({
					page: 'true',
					cursor: followings[followings.length - 1].id,
				})}` : undefined,
			);

			ctx.body = this.apRendererService.renderActivity(rendered);
			this.setResponseType(ctx);
		} else {
			// index page
			const rendered = this.apRendererService.renderOrderedCollection(partOf, user.followersCount, `${partOf}?page=true`);
			ctx.body = this.apRendererService.renderActivity(rendered);
			ctx.set('Cache-Control', 'public, max-age=180');
			this.setResponseType(ctx);
		}
	}

	private async following(ctx: Router.RouterContext) {
		const userId = ctx.params.user;

		const cursor = ctx.request.query.cursor;
		if (cursor != null && typeof cursor !== 'string') {
			ctx.status = 400;
			return;
		}
	
		const page = ctx.request.query.page === 'true';
	
		const user = await this.usersRepository.findOneBy({
			id: userId,
			host: IsNull(),
		});
	
		if (user == null) {
			ctx.status = 404;
			return;
		}
	
		//#region Check ff visibility
		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });
	
		if (profile.ffVisibility === 'private') {
			ctx.status = 403;
			ctx.set('Cache-Control', 'public, max-age=30');
			return;
		} else if (profile.ffVisibility === 'followers') {
			ctx.status = 403;
			ctx.set('Cache-Control', 'public, max-age=30');
			return;
		}
		//#endregion
	
		const limit = 10;
		const partOf = `${this.config.url}/users/${userId}/following`;
	
		if (page) {
			const query = {
				followerId: user.id,
			} as FindOptionsWhere<Following>;
	
			// カーソルが指定されている場合
			if (cursor) {
				query.id = LessThan(cursor);
			}
	
			// Get followings
			const followings = await this.followingsRepository.find({
				where: query,
				take: limit + 1,
				order: { id: -1 },
			});
	
			// 「次のページ」があるかどうか
			const inStock = followings.length === limit + 1;
			if (inStock) followings.pop();
	
			const renderedFollowees = await Promise.all(followings.map(following => this.apRendererService.renderFollowUser(following.followeeId)));
			const rendered = this.apRendererService.renderOrderedCollectionPage(
				`${partOf}?${url.query({
					page: 'true',
					cursor,
				})}`,
				user.followingCount, renderedFollowees, partOf,
				undefined,
				inStock ? `${partOf}?${url.query({
					page: 'true',
					cursor: followings[followings.length - 1].id,
				})}` : undefined,
			);
	
			ctx.body = this.apRendererService.renderActivity(rendered);
			this.setResponseType(ctx);
		} else {
			// index page
			const rendered = this.apRendererService.renderOrderedCollection(partOf, user.followingCount, `${partOf}?page=true`);
			ctx.body = this.apRendererService.renderActivity(rendered);
			ctx.set('Cache-Control', 'public, max-age=180');
			this.setResponseType(ctx);
		}
	}

	private async featured(ctx: Router.RouterContext) {
		const userId = ctx.params.user;

		const user = await this.usersRepository.findOneBy({
			id: userId,
			host: IsNull(),
		});

		if (user == null) {
			ctx.status = 404;
			return;
		}

		const pinings = await this.userNotePiningsRepository.find({
			where: { userId: user.id },
			order: { id: 'DESC' },
		});

		const pinnedNotes = await Promise.all(pinings.map(pining =>
			this.notesRepository.findOneByOrFail({ id: pining.noteId })));

		const renderedNotes = await Promise.all(pinnedNotes.map(note => this.apRendererService.renderNote(note)));

		const rendered = this.apRendererService.renderOrderedCollection(
			`${this.config.url}/users/${userId}/collections/featured`,
			renderedNotes.length, undefined, undefined, renderedNotes,
		);

		ctx.body = this.apRendererService.renderActivity(rendered);
		ctx.set('Cache-Control', 'public, max-age=180');
		this.setResponseType(ctx);
	}

	private async outbox(ctx: Router.RouterContext) {
		const userId = ctx.params.user;

		const sinceId = ctx.request.query.since_id;
		if (sinceId != null && typeof sinceId !== 'string') {
			ctx.status = 400;
			return;
		}
	
		const untilId = ctx.request.query.until_id;
		if (untilId != null && typeof untilId !== 'string') {
			ctx.status = 400;
			return;
		}
	
		const page = ctx.request.query.page === 'true';
	
		if (countIf(x => x != null, [sinceId, untilId]) > 1) {
			ctx.status = 400;
			return;
		}
	
		const user = await this.usersRepository.findOneBy({
			id: userId,
			host: IsNull(),
		});
	
		if (user == null) {
			ctx.status = 404;
			return;
		}
	
		const limit = 20;
		const partOf = `${this.config.url}/users/${userId}/outbox`;
	
		if (page) {
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), sinceId, untilId)
				.andWhere('note.userId = :userId', { userId: user.id })
				.andWhere(new Brackets(qb => { qb
					.where('note.visibility = \'public\'')
					.orWhere('note.visibility = \'home\'');
				}))
				.andWhere('note.localOnly = FALSE');
	
			const notes = await query.take(limit).getMany();
	
			if (sinceId) notes.reverse();
	
			const activities = await Promise.all(notes.map(note => this.packActivity(note)));
			const rendered = this.apRendererService.renderOrderedCollectionPage(
				`${partOf}?${url.query({
					page: 'true',
					since_id: sinceId,
					until_id: untilId,
				})}`,
				user.notesCount, activities, partOf,
				notes.length ? `${partOf}?${url.query({
					page: 'true',
					since_id: notes[0].id,
				})}` : undefined,
				notes.length ? `${partOf}?${url.query({
					page: 'true',
					until_id: notes[notes.length - 1].id,
				})}` : undefined,
			);
	
			ctx.body = this.apRendererService.renderActivity(rendered);
			this.setResponseType(ctx);
		} else {
			// index page
			const rendered = this.apRendererService.renderOrderedCollection(partOf, user.notesCount,
				`${partOf}?page=true`,
				`${partOf}?page=true&since_id=000000000000000000000000`,
			);
			ctx.body = this.apRendererService.renderActivity(rendered);
			ctx.set('Cache-Control', 'public, max-age=180');
			this.setResponseType(ctx);
		}
	}

	private async userInfo(ctx: Router.RouterContext, user: User | null) {
		if (user == null) {
			ctx.status = 404;
			return;
		}

		ctx.body = this.apRendererService.renderActivity(await this.apRendererService.renderPerson(user as ILocalUser));
		ctx.set('Cache-Control', 'public, max-age=180');
		this.setResponseType(ctx);
	}

	public createRouter() {
		// Init router
		const router = new Router();

		//#region Routing
		function isActivityPubReq(ctx: Router.RouterContext) {
			ctx.response.vary('Accept');
			const accepted = ctx.accepts('html', ACTIVITY_JSON, LD_JSON);
			return typeof accepted === 'string' && !accepted.match(/html/);
		}

		// inbox
		router.post('/inbox', json(), ctx => this.inbox(ctx));
		router.post('/users/:user/inbox', json(), ctx => this.inbox(ctx));

		// note
		router.get('/notes/:note', async (ctx, next) => {
			if (!isActivityPubReq(ctx)) return await next();

			const note = await this.notesRepository.findOneBy({
				id: ctx.params.note,
				visibility: In(['public' as const, 'home' as const]),
				localOnly: false,
			});

			if (note == null) {
				ctx.status = 404;
				return;
			}

			// リモートだったらリダイレクト
			if (note.userHost != null) {
				if (note.uri == null || this.utilityService.isSelfHost(note.userHost)) {
					ctx.status = 500;
					return;
				}
				ctx.redirect(note.uri);
				return;
			}

			ctx.body = this.apRendererService.renderActivity(await this.apRendererService.renderNote(note, false));
			ctx.set('Cache-Control', 'public, max-age=180');
			this.setResponseType(ctx);
		});

		// note activity
		router.get('/notes/:note/activity', async ctx => {
			const note = await this.notesRepository.findOneBy({
				id: ctx.params.note,
				userHost: IsNull(),
				visibility: In(['public' as const, 'home' as const]),
				localOnly: false,
			});

			if (note == null) {
				ctx.status = 404;
				return;
			}

			ctx.body = this.apRendererService.renderActivity(await this.packActivity(note));
			ctx.set('Cache-Control', 'public, max-age=180');
			this.setResponseType(ctx);
		});

		// outbox
		router.get('/users/:user/outbox', (ctx) => this.outbox(ctx));

		// followers
		router.get('/users/:user/followers', (ctx) => this.followers(ctx));

		// following
		router.get('/users/:user/following', (ctx) => this.following(ctx));

		// featured
		router.get('/users/:user/collections/featured', (ctx) => this.featured(ctx));

		// publickey
		router.get('/users/:user/publickey', async ctx => {
			const userId = ctx.params.user;

			const user = await this.usersRepository.findOneBy({
				id: userId,
				host: IsNull(),
			});

			if (user == null) {
				ctx.status = 404;
				return;
			}

			const keypair = await this.userKeypairStoreService.getUserKeypair(user.id);

			if (this.userEntityService.isLocalUser(user)) {
				ctx.body = this.apRendererService.renderActivity(this.apRendererService.renderKey(user, keypair));
				ctx.set('Cache-Control', 'public, max-age=180');
				this.setResponseType(ctx);
			} else {
				ctx.status = 400;
			}
		});

		router.get('/users/:user', async (ctx, next) => {
			if (!isActivityPubReq(ctx)) return await next();

			const userId = ctx.params.user;

			const user = await this.usersRepository.findOneBy({
				id: userId,
				host: IsNull(),
				isSuspended: false,
			});

			await this.userInfo(ctx, user);
		});

		router.get('/@:user', async (ctx, next) => {
			if (!isActivityPubReq(ctx)) return await next();

			const user = await this.usersRepository.findOneBy({
				usernameLower: ctx.params.user.toLowerCase(),
				host: IsNull(),
				isSuspended: false,
			});

			await this.userInfo(ctx, user);
		});
		//#endregion

		// emoji
		router.get('/emojis/:emoji', async ctx => {
			const emoji = await this.emojisRepository.findOneBy({
				host: IsNull(),
				name: ctx.params.emoji,
			});

			if (emoji == null) {
				ctx.status = 404;
				return;
			}

			ctx.body = this.apRendererService.renderActivity(await this.apRendererService.renderEmoji(emoji));
			ctx.set('Cache-Control', 'public, max-age=180');
			this.setResponseType(ctx);
		});

		// like
		router.get('/likes/:like', async ctx => {
			const reaction = await this.noteReactionsRepository.findOneBy({ id: ctx.params.like });

			if (reaction == null) {
				ctx.status = 404;
				return;
			}

			const note = await this.notesRepository.findOneBy({ id: reaction.noteId });

			if (note == null) {
				ctx.status = 404;
				return;
			}

			ctx.body = this.apRendererService.renderActivity(await this.apRendererService.renderLike(reaction, note));
			ctx.set('Cache-Control', 'public, max-age=180');
			this.setResponseType(ctx);
		});

		// follow
		router.get('/follows/:follower/:followee', async ctx => {
			// This may be used before the follow is completed, so we do not
			// check if the following exists.

			const [follower, followee] = await Promise.all([
				this.usersRepository.findOneBy({
					id: ctx.params.follower,
					host: IsNull(),
				}),
				this.usersRepository.findOneBy({
					id: ctx.params.followee,
					host: Not(IsNull()),
				}),
			]);

			if (follower == null || followee == null) {
				ctx.status = 404;
				return;
			}

			ctx.body = this.apRendererService.renderActivity(this.apRendererService.renderFollow(follower, followee));
			ctx.set('Cache-Control', 'public, max-age=180');
			this.setResponseType(ctx);
		});

		return router;
	}
}
