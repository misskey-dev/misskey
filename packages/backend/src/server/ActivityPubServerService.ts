/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as crypto from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { Inject, Injectable } from '@nestjs/common';
import { Hono } from 'hono';
import { accepts } from 'hono/accepts';
import httpSignature from '@peertube/http-signature';
import { Brackets, In, IsNull, LessThan, Not } from 'typeorm';
import secureJson from 'secure-json-parse';
import { DI } from '@/di-symbols.js';
import type { FollowingsRepository, NotesRepository, EmojisRepository, NoteReactionsRepository, UserProfilesRepository, UserNotePiningsRepository, UsersRepository, FollowRequestsRepository, MiMeta } from '@/models/_.js';
import * as url from '@/misc/prelude/url.js';
import type { Config } from '@/config.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { QueueService } from '@/core/QueueService.js';
import type { MiLocalUser, MiRemoteUser, MiUser } from '@/models/User.js';
import { UserKeypairService } from '@/core/UserKeypairService.js';
import type { MiFollowing } from '@/models/Following.js';
import { countIf } from '@/misc/prelude/array.js';
import type { MiNote } from '@/models/Note.js';
import { QueryService } from '@/core/QueryService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import type { IActivity } from '@/core/activitypub/type.js';
import { isQuote, isRenote } from '@/misc/is-renote.js';
import * as Acct from '@/misc/acct.js';
import { FanoutTimelineEndpointService } from '@/core/FanoutTimelineEndpointService.js';
import { vary } from '@/misc/hono-vary.js';
import type { Context as HonoContext } from 'hono';
import type { FindOptionsWhere } from 'typeorm';

const ACTIVITY_JSON = 'application/activity+json';
const LD_JSON = 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"';

@Injectable()
export class ActivityPubServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

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

		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private utilityService: UtilityService,
		private userEntityService: UserEntityService,
		private apRendererService: ApRendererService,
		private queueService: QueueService,
		private userKeypairService: UserKeypairService,
		private queryService: QueryService,
		private fanoutTimelineEndpointService: FanoutTimelineEndpointService,
	) {
		//this.createServer = this.createServer.bind(this);
	}

	@bindThis
	private getRawRequest(ctx: HonoContext): IncomingMessage {
		const raw = (ctx.env as { incoming?: IncomingMessage }).incoming;
		if (raw == null) {
			throw new Error('IncomingMessage is not available in ActivityPubServerService');
		}

		return raw;
	}

	@bindThis
	private setResponseType(ctx: HonoContext): void {
		const accept = accepts(ctx, {
			header: 'Accept',
			supports: ['application/activity+json', 'application/ld+json'],
			default: 'application/activity+json',
		});

		if (accept === 'application/ld+json') {
			ctx.header('Content-Type', LD_JSON);
		} else {
			ctx.header('Content-Type', ACTIVITY_JSON);
		}
	}

	@bindThis
	private renderActivityPub(ctx: HonoContext, payload: unknown): Response {
		return ctx.body(JSON.stringify(payload));
	}

	/**
	 * Pack Create<Note> or Announce Activity
	 * @param note Note
	 */
	@bindThis
	private async packActivity(note: MiNote): Promise<any> {
		if (isRenote(note) && !isQuote(note)) {
			const renote = await this.notesRepository.findOneByOrFail({ id: note.renoteId });
			return this.apRendererService.renderAnnounce(renote.uri ? renote.uri : `${this.config.url}/notes/${renote.id}`, note);
		}

		return this.apRendererService.renderCreate(await this.apRendererService.renderNote(note, false), note);
	}

	@bindThis
	private wantsActivityPub(ctx: HonoContext): boolean {
		return accepts(ctx, {
			header: 'Accept',
			supports: ['text/html', 'application/activity+json', 'application/ld+json'],
			default: 'text/html',
		}) !== 'text/html';
	}

	@bindThis
	private inbox(ctx: HonoContext, body: IActivity, rawBody: Buffer): Response {
		if (this.meta.federation === 'none') {
			return ctx.body(null, 403);
		}

		const request = this.getRawRequest(ctx);

		let signature;

		try {
			signature = httpSignature.parseRequest(request, { 'headers': ['(request-target)', 'host', 'date'], authorizationHeaderName: 'signature' });
		} catch (_) {
			return ctx.body(null, 401);
		}

		if (signature.params.headers.indexOf('host') === -1
			|| request.headers.host !== this.config.host) {
			// Host not specified or not match.
			return ctx.body(null, 401);
		}

		if (signature.params.headers.indexOf('digest') === -1) {
			// Digest not found.
			return ctx.body(null, 401);
		} else {
			const digest = request.headers.digest;

			if (typeof digest !== 'string') {
				// Huh?
				return ctx.body(null, 401);
			}

			const re = /^([a-zA-Z0-9\-]+)=(.+)$/;
			const match = digest.match(re);

			if (match == null) {
				// Invalid digest
				return ctx.body(null, 401);
			}

			const algo = match[1].toUpperCase();
			const digestValue = match[2];

			if (algo !== 'SHA-256') {
				// Unsupported digest algorithm
				return ctx.body(null, 401);
			}

			const hash = crypto.createHash('sha256').update(rawBody).digest('base64');

			if (hash !== digestValue) {
				// Invalid digest
				return ctx.body(null, 401);
			}
		}

		this.queueService.inbox(body, signature);
		return ctx.body(null, 202);
	}

	@bindThis
	private async followers(ctx: HonoContext): Promise<Response> {
		if (this.meta.federation === 'none') {
			return ctx.body(null, 403);
		}

		const userId = ctx.req.param('user');
		const cursor = ctx.req.query('cursor');
		const page = ctx.req.query('page') === 'true';

		const user = await this.usersRepository.findOneBy({
			id: userId,
			host: IsNull(),
		});

		if (user == null) {
			return ctx.body(null, 404);
		}

		//#region Check ff visibility
		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

		if (profile.followersVisibility === 'private') {
			ctx.header('Cache-Control', 'public, max-age=30');
			return ctx.body(null, 403);
		} else if (profile.followersVisibility === 'followers') {
			ctx.header('Cache-Control', 'public, max-age=30');
			return ctx.body(null, 403);
		}
		//#endregion

		const limit = 10;
		const partOf = `${this.config.url}/users/${userId}/followers`;

		if (page) {
			const query = {
				followeeId: user.id,
			} as FindOptionsWhere<MiFollowing>;

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
					cursor: followings.at(-1)!.id,
				})}` : undefined,
			);

			this.setResponseType(ctx);
			return this.renderActivityPub(ctx, this.apRendererService.addContext(rendered));
		} else {
			// index page
			const rendered = this.apRendererService.renderOrderedCollection(
				partOf,
				user.followersCount,
				`${partOf}?page=true`,
			);
			ctx.header('Cache-Control', 'public, max-age=180');
			this.setResponseType(ctx);
			return this.renderActivityPub(ctx, this.apRendererService.addContext(rendered));
		}
	}

	@bindThis
	private async following(ctx: HonoContext): Promise<Response> {
		if (this.meta.federation === 'none') {
			return ctx.body(null, 403);
		}

		const userId = ctx.req.param('user');
		const cursor = ctx.req.query('cursor');
		const page = ctx.req.query('page') === 'true';

		const user = await this.usersRepository.findOneBy({
			id: userId,
			host: IsNull(),
		});

		if (user == null) {
			return ctx.body(null, 404);
		}

		//#region Check ff visibility
		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

		if (profile.followingVisibility === 'private') {
			ctx.header('Cache-Control', 'public, max-age=30');
			return ctx.body(null, 403);
		} else if (profile.followingVisibility === 'followers') {
			ctx.header('Cache-Control', 'public, max-age=30');
			return ctx.body(null, 403);
		}
		//#endregion

		const limit = 10;
		const partOf = `${this.config.url}/users/${userId}/following`;

		if (page) {
			const query = {
				followerId: user.id,
			} as FindOptionsWhere<MiFollowing>;

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
					cursor: followings.at(-1)!.id,
				})}` : undefined,
			);

			this.setResponseType(ctx);
			return this.renderActivityPub(ctx, this.apRendererService.addContext(rendered));
		} else {
			// index page
			const rendered = this.apRendererService.renderOrderedCollection(
				partOf,
				user.followingCount,
				`${partOf}?page=true`,
			);
			ctx.header('Cache-Control', 'public, max-age=180');
			this.setResponseType(ctx);
			return this.renderActivityPub(ctx, this.apRendererService.addContext(rendered));
		}
	}

	@bindThis
	private async featured(ctx: HonoContext): Promise<Response> {
		if (this.meta.federation === 'none') {
			return ctx.body(null, 403);
		}

		const userId = ctx.req.param('user');

		const user = await this.usersRepository.findOneBy({
			id: userId,
			host: IsNull(),
		});

		if (user == null) {
			return ctx.body(null, 404);
		}

		const pinings = await this.userNotePiningsRepository.find({
			where: { userId: user.id },
			order: { id: 'DESC' },
		});

		const pinnedNotes = (await Promise.all(pinings.map(pining =>
			this.notesRepository.findOneByOrFail({ id: pining.noteId }))))
			.filter(note => !note.localOnly && ['public', 'home'].includes(note.visibility));

		const renderedNotes = await Promise.all(pinnedNotes.map(note => this.apRendererService.renderNote(note)));

		const rendered = this.apRendererService.renderOrderedCollection(
			`${this.config.url}/users/${userId}/collections/featured`,
			renderedNotes.length,
			undefined,
			undefined,
			renderedNotes,
		);

		ctx.header('Cache-Control', 'public, max-age=180');
		this.setResponseType(ctx);
		return this.renderActivityPub(ctx, this.apRendererService.addContext(rendered));
	}

	@bindThis
	private async outbox(ctx: HonoContext): Promise<Response> {
		if (this.meta.federation === 'none') {
			return ctx.body(null, 403);
		}

		const userId = ctx.req.param('user');
		const sinceId = ctx.req.query('since_id');
		const untilId = ctx.req.query('until_id');
		const page = ctx.req.query('page') === 'true';

		if (countIf(x => x != null, [sinceId, untilId]) > 1) {
			return ctx.body(null, 400);
		}

		const user = await this.usersRepository.findOneBy({
			id: userId,
			host: IsNull(),
		});

		if (user == null) {
			return ctx.body(null, 404);
		}

		const limit = 20;
		const partOf = `${this.config.url}/users/${userId}/outbox`;

		if (page) {
			const notes = this.meta.enableFanoutTimeline ? await this.fanoutTimelineEndpointService.getMiNotes({
				sinceId: sinceId ?? null,
				untilId: untilId ?? null,
				limit: limit,
				allowPartial: false, // Possibly true? IDK it's OK for ordered collection.
				me: null,
				redisTimelines: [
					`userTimeline:${user.id}`,
					`userTimelineWithReplies:${user.id}`,
				],
				useDbFallback: true,
				ignoreAuthorFromMute: true,
				excludePureRenotes: false,
				noteFilter: (note) => {
					if (note.visibility !== 'home' && note.visibility !== 'public') return false;
					if (note.localOnly) return false;
					return true;
				},
				dbFallback: async (untilId, sinceId, limit) => {
					return await this.getUserNotesFromDb({
						untilId,
						sinceId,
						limit,
						userId: user.id,
					});
				},
			}) : await this.getUserNotesFromDb({
				untilId: untilId ?? null,
				sinceId: sinceId ?? null,
				limit,
				userId: user.id,
			});

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
					until_id: notes.at(-1)!.id,
				})}` : undefined,
			);

			this.setResponseType(ctx);
			return this.renderActivityPub(ctx, this.apRendererService.addContext(rendered));
		} else {
			// index page
			const rendered = this.apRendererService.renderOrderedCollection(
				partOf,
				user.notesCount,
				`${partOf}?page=true`,
				`${partOf}?page=true&since_id=000000000000000000000000`,
			);
			ctx.header('Cache-Control', 'public, max-age=180');
			this.setResponseType(ctx);
			return this.renderActivityPub(ctx, this.apRendererService.addContext(rendered));
		}
	}

	@bindThis
	private async getUserNotesFromDb(ps: {
		untilId: string | null,
		sinceId: string | null,
		limit: number,
		userId: MiUser['id'],
	}) {
		return await this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
			.andWhere('note.userId = :userId', { userId: ps.userId })
			.andWhere(new Brackets(qb => {
				qb
					.where('note.visibility = \'public\'')
					.orWhere('note.visibility = \'home\'');
			}))
			.andWhere('note.localOnly = FALSE')
			.limit(ps.limit)
			.getMany();
	}

	@bindThis
	private async userInfo(ctx: HonoContext, user: MiUser | null): Promise<Response> {
		if (this.meta.federation === 'none') {
			return ctx.body(null, 403);
		}

		if (user == null) {
			return ctx.body(null, 404);
		}

		// リモートだったらリダイレクト
		if (user.host != null) {
			if (user.uri == null || this.utilityService.isSelfHost(user.host)) {
				return ctx.body(null, 500);
			}
			return ctx.redirect(user.uri, 301);
		}

		ctx.header('Cache-Control', 'public, max-age=180');
		this.setResponseType(ctx);
		return this.renderActivityPub(ctx, this.apRendererService.addContext(await this.apRendererService.renderPerson(user as MiLocalUser)));
	}

	@bindThis
	private async parseActivityPubBody(ctx: HonoContext): Promise<{ body: IActivity; rawBody: Buffer } | Response> {
		const rawBody = Buffer.from(await ctx.req.arrayBuffer());
		if (rawBody.length === 0) {
			return ctx.body(null, 400);
		}

		if (rawBody.length > 1024 * 64) {
			return ctx.body(null, 413);
		}

		try {
			const body = secureJson.parse(rawBody.toString('utf8'), null, {
				protoAction: 'ignore',
				constructorAction: 'ignore',
			}) as IActivity;
			return { body, rawBody };
		} catch {
			return ctx.body(null, 400);
		}
	}

	@bindThis
	private async note(ctx: HonoContext): Promise<Response> {
		if (this.meta.federation === 'none') {
			return ctx.body(null, 403);
		}

		const note = await this.notesRepository.findOneBy({
			id: ctx.req.param('note'),
			visibility: In(['public', 'home']),
			localOnly: false,
		});

		if (note == null) {
			return ctx.body(null, 404);
		}

		if (note.userHost != null) {
			if (note.uri == null || this.utilityService.isSelfHost(note.userHost)) {
				return ctx.body(null, 500);
			}

			return ctx.redirect(note.uri);
		}

		ctx.header('Cache-Control', 'public, max-age=180');
		this.setResponseType(ctx);
		return this.renderActivityPub(ctx, this.apRendererService.addContext(await this.apRendererService.renderNote(note, false)));
	}

	@bindThis
	private async noteActivity(ctx: HonoContext): Promise<Response> {
		if (this.meta.federation === 'none') {
			return ctx.body(null, 403);
		}

		const note = await this.notesRepository.findOneBy({
			id: ctx.req.param('note'),
			userHost: IsNull(),
			visibility: In(['public', 'home']),
			localOnly: false,
		});

		if (note == null) {
			return ctx.body(null, 404);
		}

		ctx.header('Cache-Control', 'public, max-age=180');
		this.setResponseType(ctx);
		return this.renderActivityPub(ctx, this.apRendererService.addContext(await this.packActivity(note)));
	}

	@bindThis
	private async publicKey(ctx: HonoContext): Promise<Response> {
		if (this.meta.federation === 'none') {
			return ctx.body(null, 403);
		}

		const user = await this.usersRepository.findOneBy({
			id: ctx.req.param('user'),
			host: IsNull(),
		});

		if (user == null) {
			return ctx.body(null, 404);
		}

		if (!this.userEntityService.isLocalUser(user)) {
			return ctx.body(null, 400);
		}

		const keypair = await this.userKeypairService.getUserKeypair(user.id);
		ctx.header('Cache-Control', 'public, max-age=180');
		this.setResponseType(ctx);
		return this.renderActivityPub(ctx, this.apRendererService.addContext(this.apRendererService.renderKey(user, keypair)));
	}

	@bindThis
	private async emoji(ctx: HonoContext): Promise<Response> {
		if (this.meta.federation === 'none') {
			return ctx.body(null, 403);
		}

		const emoji = await this.emojisRepository.findOneBy({
			host: IsNull(),
			name: ctx.req.param('emoji'),
		});

		if (emoji == null || emoji.localOnly) {
			return ctx.body(null, 404);
		}

		ctx.header('Cache-Control', 'public, max-age=180');
		this.setResponseType(ctx);
		return this.renderActivityPub(ctx, this.apRendererService.addContext(await this.apRendererService.renderEmoji(emoji)));
	}

	@bindThis
	private async like(ctx: HonoContext): Promise<Response> {
		if (this.meta.federation === 'none') {
			return ctx.body(null, 403);
		}

		const reaction = await this.noteReactionsRepository.findOneBy({ id: ctx.req.param('like') });
		if (reaction == null) {
			return ctx.body(null, 404);
		}

		const note = await this.notesRepository.findOneBy({ id: reaction.noteId });
		if (note == null) {
			return ctx.body(null, 404);
		}

		ctx.header('Cache-Control', 'public, max-age=180');
		this.setResponseType(ctx);
		return this.renderActivityPub(ctx, this.apRendererService.addContext(await this.apRendererService.renderLike(reaction, note)));
	}

	@bindThis
	private async follow(ctx: HonoContext): Promise<Response> {
		if (this.meta.federation === 'none') {
			return ctx.body(null, 403);
		}

		const [follower, followee] = await Promise.all([
			this.usersRepository.findOneBy({
				id: ctx.req.param('follower'),
				host: IsNull(),
			}),
			this.usersRepository.findOneBy({
				id: ctx.req.param('followee'),
				host: Not(IsNull()),
			}),
		]) as [MiLocalUser | MiRemoteUser | null, MiLocalUser | MiRemoteUser | null];

		if (follower == null || followee == null) {
			return ctx.body(null, 404);
		}

		ctx.header('Cache-Control', 'public, max-age=180');
		this.setResponseType(ctx);
		return this.renderActivityPub(ctx, this.apRendererService.addContext(this.apRendererService.renderFollow(follower, followee)));
	}

	@bindThis
	private async followRequest(ctx: HonoContext): Promise<Response> {
		if (this.meta.federation === 'none') {
			return ctx.body(null, 403);
		}

		const followRequest = await this.followRequestsRepository.findOneBy({
			id: ctx.req.param('followRequestId'),
		});

		if (followRequest == null) {
			return ctx.body(null, 404);
		}

		const [follower, followee] = await Promise.all([
			this.usersRepository.findOneBy({
				id: followRequest.followerId,
				host: IsNull(),
			}),
			this.usersRepository.findOneBy({
				id: followRequest.followeeId,
				host: Not(IsNull()),
			}),
		]) as [MiLocalUser | MiRemoteUser | null, MiLocalUser | MiRemoteUser | null];

		if (follower == null || followee == null) {
			return ctx.body(null, 404);
		}

		ctx.header('Cache-Control', 'public, max-age=180');
		this.setResponseType(ctx);
		return this.renderActivityPub(ctx, this.apRendererService.addContext(this.apRendererService.renderFollow(follower, followee)));
	}

	public createServer(): Hono {
		const hono = new Hono();

		hono.use(async (ctx, next) => {
			ctx.header('Access-Control-Allow-Headers', 'Accept');
			ctx.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
			ctx.header('Access-Control-Allow-Origin', '*');
			ctx.header('Access-Control-Expose-Headers', 'Vary');
			await next();
		});

		hono.options('*', (ctx) => ctx.body(null, 204));

		hono.post('/inbox', async (ctx) => {
			const parsed = await this.parseActivityPubBody(ctx);
			if (parsed instanceof Response) return parsed;
			return this.inbox(ctx, parsed.body, parsed.rawBody);
		});

		hono.post('/users/:user/inbox', async (ctx) => {
			const parsed = await this.parseActivityPubBody(ctx);
			if (parsed instanceof Response) return parsed;
			return this.inbox(ctx, parsed.body, parsed.rawBody);
		});

		hono.get('/notes/:note', async (ctx, next) => {
			vary(ctx, 'Accept');
			if (!this.wantsActivityPub(ctx)) {
				await next();
				return;
			}

			return await this.note(ctx);
		});

		hono.get('/notes/:note/activity', async (ctx) => {
			vary(ctx, 'Accept');
			return await this.noteActivity(ctx);
		});

		hono.get('/users/:user/outbox', async (ctx) => await this.outbox(ctx));
		hono.get('/users/:user/followers', async (ctx) => await this.followers(ctx));
		hono.get('/users/:user/following', async (ctx) => await this.following(ctx));
		hono.get('/users/:user/collections/featured', async (ctx) => await this.featured(ctx));

		hono.get('/users/:user/publickey', async (ctx) => {
			return await this.publicKey(ctx);
		});

		hono.get('/users/:user', async (ctx, next) => {
			vary(ctx, 'Accept');
			if (!this.wantsActivityPub(ctx)) {
				await next();
				return;
			}

			const user = await this.usersRepository.findOneBy({
				id: ctx.req.param('user'),
				isSuspended: false,
			});

			return await this.userInfo(ctx, user);
		});

		hono.get('/@:acct', async (ctx, next) => {
			vary(ctx, 'Accept');
			if (!this.wantsActivityPub(ctx)) {
				await next();
				return;
			}

			const acctParam = ctx.req.param('acct');
			if (acctParam == null) {
				return ctx.body(null, 404);
			}

			const acct = Acct.parse(acctParam);
			const user = await this.usersRepository.findOneBy({
				usernameLower: acct.username.toLowerCase(),
				host: acct.host ?? IsNull(),
				isSuspended: false,
			});

			return await this.userInfo(ctx, user);
		});

		hono.get('/emojis/:emoji', async (ctx) => {
			return await this.emoji(ctx);
		});

		hono.get('/likes/:like', async (ctx) => {
			return await this.like(ctx);
		});

		hono.get('/follows/:follower/:followee', async (ctx) => {
			return await this.follow(ctx);
		});

		hono.get('/follows/:followRequestId', async (ctx) => {
			return await this.followRequest(ctx);
		});

		return hono;
	}
}
