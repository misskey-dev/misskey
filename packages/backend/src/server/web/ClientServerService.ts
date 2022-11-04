import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PathOrFileDescriptor, readFileSync } from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import Koa from 'koa';
import Router from '@koa/router';
import send from 'koa-send';
import favicon from 'koa-favicon';
import views from 'koa-views';
import sharp from 'sharp';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter.js';
import { KoaAdapter } from '@bull-board/koa';
import { In, IsNull } from 'typeorm';
import type { Config } from '@/config.js';
import { getNoteSummary } from '@/misc/get-note-summary.js';
import { DI } from '@/di-symbols.js';
import * as Acct from '@/misc/acct.js';
import { MetaService } from '@/core/MetaService.js';
import type { DbQueue, DeliverQueue, EndedPollNotificationQueue, InboxQueue, ObjectStorageQueue, SystemQueue, WebhookDeliverQueue } from '@/core/queue/QueueModule.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { PageEntityService } from '@/core/entities/PageEntityService.js';
import { GalleryPostEntityService } from '@/core/entities/GalleryPostEntityService.js';
import { ClipEntityService } from '@/core/entities/ClipEntityService.js';
import { ChannelEntityService } from '@/core/entities/ChannelEntityService.js';
import type { ChannelsRepository, ClipsRepository, GalleryPostsRepository, NotesRepository, PagesRepository, UserProfilesRepository, UsersRepository } from '@/models/index.js';
import manifest from './manifest.json' assert { type: 'json' };
import { FeedService } from './FeedService.js';
import { UrlPreviewService } from './UrlPreviewService.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const staticAssets = `${_dirname}/../../../assets/`;
const clientAssets = `${_dirname}/../../../../client/assets/`;
const assets = `${_dirname}/../../../../../built/_client_dist_/`;
const swAssets = `${_dirname}/../../../../../built/_sw_dist_/`;

@Injectable()
export class ClientServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,
		private pageEntityService: PageEntityService,
		private galleryPostEntityService: GalleryPostEntityService,
		private clipEntityService: ClipEntityService,
		private channelEntityService: ChannelEntityService,
		private metaService: MetaService,
		private urlPreviewService: UrlPreviewService,
		private feedService: FeedService,

		@Inject('queue:system') public systemQueue: SystemQueue,
		@Inject('queue:endedPollNotification') public endedPollNotificationQueue: EndedPollNotificationQueue,
		@Inject('queue:deliver') public deliverQueue: DeliverQueue,
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
		@Inject('queue:db') public dbQueue: DbQueue,
		@Inject('queue:objectStorage') public objectStorageQueue: ObjectStorageQueue,
		@Inject('queue:webhookDeliver') public webhookDeliverQueue: WebhookDeliverQueue,
	) {
	}

	private async manifestHandler(ctx: Koa.Context) {
		// TODO
		//const res = structuredClone(manifest);
		const res = JSON.parse(JSON.stringify(manifest));

		const instance = await this.metaService.fetch(true);

		res.short_name = instance.name ?? 'Misskey';
		res.name = instance.name ?? 'Misskey';
		if (instance.themeColor) res.theme_color = instance.themeColor;

		ctx.set('Cache-Control', 'max-age=300');
		ctx.body = res;
	}

	public createApp() {
		const app = new Koa();

		//#region Bull Dashboard
		const bullBoardPath = '/queue';

		// Authenticate
		app.use(async (ctx, next) => {
			if (ctx.path === bullBoardPath || ctx.path.startsWith(bullBoardPath + '/')) {
				const token = ctx.cookies.get('token');
				if (token == null) {
					ctx.status = 401;
					return;
				}
				const user = await this.usersRepository.findOneBy({ token });
				if (user == null || !(user.isAdmin || user.isModerator)) {
					ctx.status = 403;
					return;
				}
			}
			await next();
		});

		const serverAdapter = new KoaAdapter();

		createBullBoard({
			queues: [
				this.systemQueue,
				this.endedPollNotificationQueue,
				this.deliverQueue,
				this.inboxQueue,
				this.dbQueue,
				this.objectStorageQueue,
				this.webhookDeliverQueue,
			].map(q => new BullAdapter(q)),
			serverAdapter,
		});

		serverAdapter.setBasePath(bullBoardPath);
		app.use(serverAdapter.registerPlugin());
		//#endregion

		// Init renderer
		app.use(views(_dirname + '/views', {
			extension: 'pug',
			options: {
				version: this.config.version,
				getClientEntry: () => process.env.NODE_ENV === 'production' ?
					this.config.clientEntry :
					JSON.parse(readFileSync(`${_dirname}/../../../../../built/_client_dist_/manifest.json`, 'utf-8'))['src/init.ts'],
				config: this.config,
			},
		}));

		// Serve favicon
		app.use(favicon(`${_dirname}/../../../assets/favicon.ico`));

		// Common request handler
		app.use(async (ctx, next) => {
			// IFrameの中に入れられないようにする
			ctx.set('X-Frame-Options', 'DENY');
			await next();
		});

		// Init router
		const router = new Router();

		//#region static assets

		router.get('/static-assets/(.*)', async ctx => {
			await send(ctx as any, ctx.path.replace('/static-assets/', ''), {
				root: staticAssets,
				maxage: ms('7 days'),
			});
		});

		router.get('/client-assets/(.*)', async ctx => {
			await send(ctx as any, ctx.path.replace('/client-assets/', ''), {
				root: clientAssets,
				maxage: ms('7 days'),
			});
		});

		router.get('/assets/(.*)', async ctx => {
			await send(ctx as any, ctx.path.replace('/assets/', ''), {
				root: assets,
				maxage: ms('7 days'),
			});
		});

		// Apple touch icon
		router.get('/apple-touch-icon.png', async ctx => {
			await send(ctx as any, '/apple-touch-icon.png', {
				root: staticAssets,
			});
		});

		router.get('/twemoji/(.*)', async ctx => {
			const path = ctx.path.replace('/twemoji/', '');

			if (!path.match(/^[0-9a-f-]+\.svg$/)) {
				ctx.status = 404;
				return;
			}

			ctx.set('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');

			await send(ctx as any, path, {
				root: `${_dirname}/../../../node_modules/@discordapp/twemoji/dist/svg/`,
				maxage: ms('30 days'),
			});
		});

		router.get('/twemoji-badge/(.*)', async ctx => {
			const path = ctx.path.replace('/twemoji-badge/', '');

			if (!path.match(/^[0-9a-f-]+\.png$/)) {
				ctx.status = 404;
				return;
			}

			const mask = await sharp(
				`${_dirname}/../../../node_modules/@discordapp/twemoji/dist/svg/${path.replace('.png', '')}.svg`,
				{ density: 1000 },
			)
				.resize(488, 488)
				.greyscale()
				.normalise()
				.linear(1.75, -(128 * 1.75) + 128) // 1.75x contrast
				.flatten({ background: '#000' })
				.extend({
					top: 12,
					bottom: 12,
					left: 12,
					right: 12,
					background: '#000',
				})
				.toColorspace('b-w')
				.png()
				.toBuffer();

			const buffer = await sharp({
				create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
			})
				.pipelineColorspace('b-w')
				.boolean(mask, 'eor')
				.resize(96, 96)
				.png()
				.toBuffer();

			ctx.set('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');
			ctx.set('Cache-Control', 'max-age=2592000');
			ctx.set('Content-Type', 'image/png');
			ctx.body = buffer;
		});

		// ServiceWorker
		router.get('/sw.js', async ctx => {
			await send(ctx as any, '/sw.js', {
				root: swAssets,
				maxage: ms('10 minutes'),
			});
		});

		// Manifest
		router.get('/manifest.json', ctx => this.manifestHandler(ctx));

		router.get('/robots.txt', async ctx => {
			await send(ctx as any, '/robots.txt', {
				root: staticAssets,
			});
		});

		//#endregion

		// Docs
		router.get('/api-doc', async ctx => {
			await send(ctx as any, '/redoc.html', {
				root: staticAssets,
			});
		});

		// URL preview endpoint
		router.get('/url', ctx => this.urlPreviewService.handle(ctx));

		router.get('/api.json', async ctx => {
			ctx.body = genOpenapiSpec();
		});

		const getFeed = async (acct: string) => {
			const { username, host } = Acct.parse(acct);
			const user = await this.usersRepository.findOneBy({
				usernameLower: username.toLowerCase(),
				host: host ?? IsNull(),
				isSuspended: false,
			});

			return user && await this.feedService.packFeed(user);
		};

		// Atom
		router.get('/@:user.atom', async ctx => {
			const feed = await getFeed(ctx.params.user);

			if (feed) {
				ctx.set('Content-Type', 'application/atom+xml; charset=utf-8');
				ctx.body = feed.atom1();
			} else {
				ctx.status = 404;
			}
		});

		// RSS
		router.get('/@:user.rss', async ctx => {
			const feed = await getFeed(ctx.params.user);

			if (feed) {
				ctx.set('Content-Type', 'application/rss+xml; charset=utf-8');
				ctx.body = feed.rss2();
			} else {
				ctx.status = 404;
			}
		});

		// JSON
		router.get('/@:user.json', async ctx => {
			const feed = await getFeed(ctx.params.user);

			if (feed) {
				ctx.set('Content-Type', 'application/json; charset=utf-8');
				ctx.body = feed.json1();
			} else {
				ctx.status = 404;
			}
		});

		//#region SSR (for crawlers)
		// User
		router.get(['/@:user', '/@:user/:sub'], async (ctx, next) => {
			const { username, host } = Acct.parse(ctx.params.user);
			const user = await this.usersRepository.findOneBy({
				usernameLower: username.toLowerCase(),
				host: host ?? IsNull(),
				isSuspended: false,
			});

			if (user != null) {
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });
				const meta = await this.metaService.fetch();
				const me = profile.fields
					? profile.fields
						.filter(filed => filed.value != null && filed.value.match(/^https?:/))
						.map(field => field.value)
					: [];

				await ctx.render('user', {
					user, profile, me,
					avatarUrl: await this.userEntityService.getAvatarUrl(user),
					sub: ctx.params.sub,
					instanceName: meta.name ?? 'Misskey',
					icon: meta.iconUrl,
					themeColor: meta.themeColor,
				});
				ctx.set('Cache-Control', 'public, max-age=15');
			} else {
				// リモートユーザーなので
				// モデレータがAPI経由で参照可能にするために404にはしない
				await next();
			}
		});

		router.get('/users/:user', async ctx => {
			const user = await this.usersRepository.findOneBy({
				id: ctx.params.user,
				host: IsNull(),
				isSuspended: false,
			});

			if (user == null) {
				ctx.status = 404;
				return;
			}

			ctx.redirect(`/@${user.username}${ user.host == null ? '' : '@' + user.host}`);
		});

		// Note
		router.get('/notes/:note', async (ctx, next) => {
			const note = await this.notesRepository.findOneBy({
				id: ctx.params.note,
				visibility: In(['public', 'home']),
			});

			if (note) {
				const _note = await this.noteEntityService.pack(note);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: note.userId });
				const meta = await this.metaService.fetch();
				await ctx.render('note', {
					note: _note,
					profile,
					avatarUrl: await this.userEntityService.getAvatarUrl(await this.usersRepository.findOneByOrFail({ id: note.userId })),
					// TODO: Let locale changeable by instance setting
					summary: getNoteSummary(_note),
					instanceName: meta.name ?? 'Misskey',
					icon: meta.iconUrl,
					themeColor: meta.themeColor,
				});

				ctx.set('Cache-Control', 'public, max-age=15');

				return;
			}

			await next();
		});

		// Page
		router.get('/@:user/pages/:page', async (ctx, next) => {
			const { username, host } = Acct.parse(ctx.params.user);
			const user = await this.usersRepository.findOneBy({
				usernameLower: username.toLowerCase(),
				host: host ?? IsNull(),
			});

			if (user == null) return;

			const page = await this.pagesRepository.findOneBy({
				name: ctx.params.page,
				userId: user.id,
			});

			if (page) {
				const _page = await this.pageEntityService.pack(page);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: page.userId });
				const meta = await this.metaService.fetch();
				await ctx.render('page', {
					page: _page,
					profile,
					avatarUrl: await this.userEntityService.getAvatarUrl(await this.usersRepository.findOneByOrFail({ id: page.userId })),
					instanceName: meta.name ?? 'Misskey',
					icon: meta.iconUrl,
					themeColor: meta.themeColor,
				});

				if (['public'].includes(page.visibility)) {
					ctx.set('Cache-Control', 'public, max-age=15');
				} else {
					ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
				}

				return;
			}

			await next();
		});

		// Clip
		// TODO: 非publicなclipのハンドリング
		router.get('/clips/:clip', async (ctx, next) => {
			const clip = await this.clipsRepository.findOneBy({
				id: ctx.params.clip,
			});

			if (clip) {
				const _clip = await this.clipEntityService.pack(clip);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: clip.userId });
				const meta = await this.metaService.fetch();
				await ctx.render('clip', {
					clip: _clip,
					profile,
					avatarUrl: await this.userEntityService.getAvatarUrl(await this.usersRepository.findOneByOrFail({ id: clip.userId })),
					instanceName: meta.name ?? 'Misskey',
					icon: meta.iconUrl,
					themeColor: meta.themeColor,
				});

				ctx.set('Cache-Control', 'public, max-age=15');

				return;
			}

			await next();
		});

		// Gallery post
		router.get('/gallery/:post', async (ctx, next) => {
			const post = await this.galleryPostsRepository.findOneBy({ id: ctx.params.post });

			if (post) {
				const _post = await this.galleryPostEntityService.pack(post);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: post.userId });
				const meta = await this.metaService.fetch();
				await ctx.render('gallery-post', {
					post: _post,
					profile,
					avatarUrl: await this.userEntityService.getAvatarUrl(await this.usersRepository.findOneByOrFail({ id: post.userId })),
					instanceName: meta.name ?? 'Misskey',
					icon: meta.iconUrl,
					themeColor: meta.themeColor,
				});

				ctx.set('Cache-Control', 'public, max-age=15');

				return;
			}

			await next();
		});

		// Channel
		router.get('/channels/:channel', async (ctx, next) => {
			const channel = await this.channelsRepository.findOneBy({
				id: ctx.params.channel,
			});

			if (channel) {
				const _channel = await this.channelEntityService.pack(channel);
				const meta = await this.metaService.fetch();
				await ctx.render('channel', {
					channel: _channel,
					instanceName: meta.name ?? 'Misskey',
					icon: meta.iconUrl,
					themeColor: meta.themeColor,
				});

				ctx.set('Cache-Control', 'public, max-age=15');

				return;
			}

			await next();
		});
		//#endregion

		router.get('/_info_card_', async ctx => {
			const meta = await this.metaService.fetch(true);

			ctx.remove('X-Frame-Options');

			await ctx.render('info-card', {
				version: this.config.version,
				host: this.config.host,
				meta: meta,
				originalUsersCount: await this.usersRepository.countBy({ host: IsNull() }),
				originalNotesCount: await this.notesRepository.countBy({ userHost: IsNull() }),
			});
		});

		router.get('/bios', async ctx => {
			await ctx.render('bios', {
				version: this.config.version,
			});
		});

		router.get('/cli', async ctx => {
			await ctx.render('cli', {
				version: this.config.version,
			});
		});

		const override = (source: string, target: string, depth = 0) =>
			[, ...target.split('/').filter(x => x), ...source.split('/').filter(x => x).splice(depth)].join('/');

		router.get('/flush', async ctx => {
			await ctx.render('flush');
		});

		// streamingに非WebSocketリクエストが来た場合にbase htmlをキャシュ付きで返すと、Proxy等でそのパスがキャッシュされておかしくなる
		router.get('/streaming', async ctx => {
			ctx.status = 503;
			ctx.set('Cache-Control', 'private, max-age=0');
		});

		// Render base html for all requests
		router.get('(.*)', async ctx => {
			const meta = await this.metaService.fetch();
			await ctx.render('base', {
				img: meta.bannerUrl,
				title: meta.name ?? 'Misskey',
				instanceName: meta.name ?? 'Misskey',
				desc: meta.description,
				icon: meta.iconUrl,
				themeColor: meta.themeColor,
			});
			ctx.set('Cache-Control', 'public, max-age=15');
		});

		// Register router
		app.use(router.routes());

		return app;
	}
}
