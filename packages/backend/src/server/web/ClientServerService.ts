import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter.js';
import { FastifyAdapter } from '@bull-board/fastify';
import ms from 'ms';
import sharp from 'sharp';
import pug from 'pug';
import { In, IsNull } from 'typeorm';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import fastifyCookie from '@fastify/cookie';
import fastifyProxy from '@fastify/http-proxy';
import vary from 'vary';
import type { Config } from '@/config.js';
import { getNoteSummary } from '@/misc/get-note-summary.js';
import { DI } from '@/di-symbols.js';
import * as Acct from '@/misc/acct.js';
import { MetaService } from '@/core/MetaService.js';
import type { DbQueue, DeliverQueue, EndedPollNotificationQueue, InboxQueue, ObjectStorageQueue, SystemQueue, WebhookDeliverQueue } from '@/core/QueueModule.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { PageEntityService } from '@/core/entities/PageEntityService.js';
import { GalleryPostEntityService } from '@/core/entities/GalleryPostEntityService.js';
import { ClipEntityService } from '@/core/entities/ClipEntityService.js';
import { ChannelEntityService } from '@/core/entities/ChannelEntityService.js';
import type { ChannelsRepository, ClipsRepository, FlashsRepository, GalleryPostsRepository, NotesRepository, PagesRepository, UserProfilesRepository, UsersRepository } from '@/models/index.js';
import type Logger from '@/logger.js';
import { deepClone } from '@/misc/clone.js';
import { bindThis } from '@/decorators.js';
import { FlashEntityService } from '@/core/entities/FlashEntityService.js';
import { RoleService } from '@/core/RoleService.js';
import manifest from './manifest.json' assert { type: 'json' };
import { FeedService } from './FeedService.js';
import { UrlPreviewService } from './UrlPreviewService.js';
import type { FastifyInstance, FastifyPluginOptions, FastifyReply } from 'fastify';
import { ClientLoggerService } from './ClientLoggerService.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const staticAssets = `${_dirname}/../../../assets/`;
const clientAssets = `${_dirname}/../../../../frontend/assets/`;
const assets = `${_dirname}/../../../../../built/_frontend_dist_/`;
const swAssets = `${_dirname}/../../../../../built/_sw_dist_/`;
const viteOut = `${_dirname}/../../../../../built/_vite_/`;

@Injectable()
export class ClientServerService {
	private logger: Logger;

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

		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		private flashEntityService: FlashEntityService,
		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,
		private pageEntityService: PageEntityService,
		private galleryPostEntityService: GalleryPostEntityService,
		private clipEntityService: ClipEntityService,
		private channelEntityService: ChannelEntityService,
		private metaService: MetaService,
		private urlPreviewService: UrlPreviewService,
		private feedService: FeedService,
		private roleService: RoleService,
		private clientLoggerService: ClientLoggerService,

		@Inject('queue:system') public systemQueue: SystemQueue,
		@Inject('queue:endedPollNotification') public endedPollNotificationQueue: EndedPollNotificationQueue,
		@Inject('queue:deliver') public deliverQueue: DeliverQueue,
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
		@Inject('queue:db') public dbQueue: DbQueue,
		@Inject('queue:objectStorage') public objectStorageQueue: ObjectStorageQueue,
		@Inject('queue:webhookDeliver') public webhookDeliverQueue: WebhookDeliverQueue,
	) {
		//this.createServer = this.createServer.bind(this);
	}

	@bindThis
	private async manifestHandler(reply: FastifyReply) {
		const res = deepClone(manifest);

		const instance = await this.metaService.fetch(true);

		res.short_name = instance.name ?? 'Misskey';
		res.name = instance.name ?? 'Misskey';
		if (instance.themeColor) res.theme_color = instance.themeColor;

		reply.header('Cache-Control', 'max-age=300');
		return (res);
	}

	@bindThis
	public createServer(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		fastify.register(fastifyCookie, {});

		//#region Bull Dashboard
		const bullBoardPath = '/queue';

		// Authenticate
		fastify.addHook('onRequest', async (request, reply) => {
			if (request.url === bullBoardPath || request.url.startsWith(bullBoardPath + '/')) {
				const token = request.cookies.token;
				if (token == null) {
					reply.code(401);
					throw new Error('login required');
				}
				const user = await this.usersRepository.findOneBy({ token });
				if (user == null) {
					reply.code(403);
					throw new Error('no such user');
				}
				const isAdministrator = await this.roleService.isAdministrator(user);
				if (!isAdministrator) {
					reply.code(403);
					throw new Error('access denied');
				}
			}
		});

		const serverAdapter = new FastifyAdapter();

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
		(fastify.register as any)(serverAdapter.registerPlugin(), { prefix: bullBoardPath });
		//#endregion

		fastify.register(fastifyView, {
			root: _dirname + '/views',
			engine: {
				pug: pug,
			},
			defaultContext: {
				version: this.config.version,
				config: this.config,
			},
		});

		fastify.addHook('onRequest', (request, reply, done) => {
			// クリックジャッキング防止のためiFrameの中に入れられないようにする
			reply.header('X-Frame-Options', 'DENY');
			done();
		});

		//#region vite assets
		if (this.config.clientManifestExists) {
			fastify.register(fastifyStatic, {
				root: viteOut,
				prefix: '/vite/',
				maxAge: ms('30 days'),
				decorateReply: false,
			});
		} else {
			fastify.register(fastifyProxy, {
				upstream: 'http://localhost:5173', // TODO: port configuration
				prefix: '/vite',
				rewritePrefix: '/vite',
			});
		}
		//#endregion

		//#region static assets

		fastify.register(fastifyStatic, {
			root: staticAssets,
			prefix: '/static-assets/',
			maxAge: ms('7 days'),
			decorateReply: false,
		});

		fastify.register(fastifyStatic, {
			root: clientAssets,
			prefix: '/client-assets/',
			maxAge: ms('7 days'),
			decorateReply: false,
		});

		fastify.register(fastifyStatic, {
			root: assets,
			prefix: '/assets/',
			maxAge: ms('7 days'),
			decorateReply: false,
		});

		fastify.get('/favicon.ico', async (request, reply) => {
			return reply.sendFile('/favicon.ico', staticAssets);
		});

		fastify.get('/apple-touch-icon.png', async (request, reply) => {
			return reply.sendFile('/apple-touch-icon.png', staticAssets);
		});

		fastify.get<{ Params: { path: string } }>('/fluent-emoji/:path(.*)', async (request, reply) => {
			const path = request.params.path;

			if (!path.match(/^[0-9a-f-]+\.png$/)) {
				reply.code(404);
				return;
			}

			reply.header('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');

			return await reply.sendFile(path, `${_dirname}/../../../../../fluent-emojis/dist/`, {
				maxAge: ms('30 days'),
			});
		});

		fastify.get<{ Params: { path: string } }>('/twemoji/:path(.*)', async (request, reply) => {
			const path = request.params.path;

			if (!path.match(/^[0-9a-f-]+\.svg$/)) {
				reply.code(404);
				return;
			}

			reply.header('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');

			return await reply.sendFile(path, `${_dirname}/../../../node_modules/@discordapp/twemoji/dist/svg/`, {
				maxAge: ms('30 days'),
			});
		});

		fastify.get<{ Params: { path: string } }>('/twemoji-badge/:path(.*)', async (request, reply) => {
			const path = request.params.path;

			if (!path.match(/^[0-9a-f-]+\.png$/)) {
				reply.code(404);
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

			reply.header('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');
			reply.header('Cache-Control', 'max-age=2592000');
			reply.header('Content-Type', 'image/png');
			return buffer;
		});

		// ServiceWorker
		fastify.get('/sw.js', async (request, reply) => {
			return await reply.sendFile('/sw.js', swAssets, {
				maxAge: ms('10 minutes'),
			});
		});

		// Manifest
		fastify.get('/manifest.json', async (request, reply) => await this.manifestHandler(reply));

		fastify.get('/robots.txt', async (request, reply) => {
			return await reply.sendFile('/robots.txt', staticAssets);
		});

		// OpenSearch XML
		fastify.get('/opensearch.xml', async (request, reply) => {
			const meta = await this.metaService.fetch();

			const name = meta.name ?? 'Misskey';
			let content = '';
			content += '<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/" xmlns:moz="http://www.mozilla.org/2006/browser/search/">';
			content += `<ShortName>${name}</ShortName>`;
			content += `<Description>${name} Search</Description>`;
			content += '<InputEncoding>UTF-8</InputEncoding>';
			content += `<Image width="16" height="16" type="image/x-icon">${this.config.url}/favicon.ico</Image>`;
			content += `<Url type="text/html" template="${this.config.url}/search?q={searchTerms}"/>`;
			content += '</OpenSearchDescription>';

			reply.header('Content-Type', 'application/opensearchdescription+xml');
			return await reply.send(content);
		});

		//#endregion

		const renderBase = async (reply: FastifyReply) => {
			const meta = await this.metaService.fetch();
			reply.header('Cache-Control', 'public, max-age=30');
			return await reply.view('base', {
				img: meta.bannerUrl,
				title: meta.name ?? 'Misskey',
				instanceName: meta.name ?? 'Misskey',
				url: this.config.url,
				desc: meta.description,
				icon: meta.iconUrl,
				themeColor: meta.themeColor,
			});
		};

		// URL preview endpoint
		fastify.get<{ Querystring: { url: string; lang: string; } }>('/url', (request, reply) => this.urlPreviewService.handle(request, reply));

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
		fastify.get<{ Params: { user: string; } }>('/@:user.atom', async (request, reply) => {
			const feed = await getFeed(request.params.user);

			if (feed) {
				reply.header('Content-Type', 'application/atom+xml; charset=utf-8');
				return feed.atom1();
			} else {
				reply.code(404);
				return;
			}
		});

		// RSS
		fastify.get<{ Params: { user: string; } }>('/@:user.rss', async (request, reply) => {
			const feed = await getFeed(request.params.user);

			if (feed) {
				reply.header('Content-Type', 'application/rss+xml; charset=utf-8');
				return feed.rss2();
			} else {
				reply.code(404);
				return;
			}
		});

		// JSON
		fastify.get<{ Params: { user: string; } }>('/@:user.json', async (request, reply) => {
			const feed = await getFeed(request.params.user);

			if (feed) {
				reply.header('Content-Type', 'application/json; charset=utf-8');
				return feed.json1();
			} else {
				reply.code(404);
				return;
			}
		});

		//#region SSR (for crawlers)
		// User
		fastify.get<{ Params: { user: string; sub?: string; } }>('/@:user/:sub?', async (request, reply) => {
			const { username, host } = Acct.parse(request.params.user);
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

				reply.header('Cache-Control', 'public, max-age=15');
				return await reply.view('user', {
					user, profile, me,
					avatarUrl: user.avatarUrl ?? this.userEntityService.getIdenticonUrl(user),
					sub: request.params.sub,
					instanceName: meta.name ?? 'Misskey',
					icon: meta.iconUrl,
					themeColor: meta.themeColor,
				});
			} else {
				// リモートユーザーなので
				// モデレータがAPI経由で参照可能にするために404にはしない
				return await renderBase(reply);
			}
		});

		fastify.get<{ Params: { user: string; } }>('/users/:user', async (request, reply) => {
			const user = await this.usersRepository.findOneBy({
				id: request.params.user,
				host: IsNull(),
				isSuspended: false,
			});

			if (user == null) {
				reply.code(404);
				return;
			}

			reply.redirect(`/@${user.username}${ user.host == null ? '' : '@' + user.host}`);
		});

		// Note
		fastify.get<{ Params: { note: string; } }>('/notes/:note', async (request, reply) => {
			vary(reply.raw, 'Accept');

			const note = await this.notesRepository.findOneBy({
				id: request.params.note,
				visibility: In(['public', 'home']),
			});

			if (note) {
				const _note = await this.noteEntityService.pack(note);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: note.userId });
				const meta = await this.metaService.fetch();
				reply.header('Cache-Control', 'public, max-age=15');
				return await reply.view('note', {
					note: _note,
					profile,
					avatarUrl: _note.user.avatarUrl,
					// TODO: Let locale changeable by instance setting
					summary: getNoteSummary(_note),
					instanceName: meta.name ?? 'Misskey',
					icon: meta.iconUrl,
					themeColor: meta.themeColor,
				});
			} else {
				return await renderBase(reply);
			}
		});

		// Page
		fastify.get<{ Params: { user: string; page: string; } }>('/@:user/pages/:page', async (request, reply) => {
			const { username, host } = Acct.parse(request.params.user);
			const user = await this.usersRepository.findOneBy({
				usernameLower: username.toLowerCase(),
				host: host ?? IsNull(),
			});

			if (user == null) return;

			const page = await this.pagesRepository.findOneBy({
				name: request.params.page,
				userId: user.id,
			});

			if (page) {
				const _page = await this.pageEntityService.pack(page);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: page.userId });
				const meta = await this.metaService.fetch();
				if (['public'].includes(page.visibility)) {
					reply.header('Cache-Control', 'public, max-age=15');
				} else {
					reply.header('Cache-Control', 'private, max-age=0, must-revalidate');
				}
				return await reply.view('page', {
					page: _page,
					profile,
					avatarUrl: _page.user.avatarUrl,
					instanceName: meta.name ?? 'Misskey',
					icon: meta.iconUrl,
					themeColor: meta.themeColor,
				});
			} else {
				return await renderBase(reply);
			}
		});

		// Flash
		fastify.get<{ Params: { id: string; } }>('/play/:id', async (request, reply) => {
			const flash = await this.flashsRepository.findOneBy({
				id: request.params.id,
			});

			if (flash) {
				const _flash = await this.flashEntityService.pack(flash);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: flash.userId });
				const meta = await this.metaService.fetch();
				reply.header('Cache-Control', 'public, max-age=15');
				return await reply.view('flash', {
					flash: _flash,
					profile,
					avatarUrl: _flash.user.avatarUrl,
					instanceName: meta.name ?? 'Misskey',
					icon: meta.iconUrl,
					themeColor: meta.themeColor,
				});
			} else {
				return await renderBase(reply);
			}
		});

		// Clip
		fastify.get<{ Params: { clip: string; } }>('/clips/:clip', async (request, reply) => {
			const clip = await this.clipsRepository.findOneBy({
				id: request.params.clip,
			});

			if (clip && clip.isPublic) {
				const _clip = await this.clipEntityService.pack(clip);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: clip.userId });
				const meta = await this.metaService.fetch();
				reply.header('Cache-Control', 'public, max-age=15');
				return await reply.view('clip', {
					clip: _clip,
					profile,
					avatarUrl: _clip.user.avatarUrl,
					instanceName: meta.name ?? 'Misskey',
					icon: meta.iconUrl,
					themeColor: meta.themeColor,
				});
			} else {
				return await renderBase(reply);
			}
		});

		// Gallery post
		fastify.get<{ Params: { post: string; } }>('/gallery/:post', async (request, reply) => {
			const post = await this.galleryPostsRepository.findOneBy({ id: request.params.post });

			if (post) {
				const _post = await this.galleryPostEntityService.pack(post);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: post.userId });
				const meta = await this.metaService.fetch();
				reply.header('Cache-Control', 'public, max-age=15');
				return await reply.view('gallery-post', {
					post: _post,
					profile,
					avatarUrl: _post.user.avatarUrl,
					instanceName: meta.name ?? 'Misskey',
					icon: meta.iconUrl,
					themeColor: meta.themeColor,
				});
			} else {
				return await renderBase(reply);
			}
		});

		// Channel
		fastify.get<{ Params: { channel: string; } }>('/channels/:channel', async (request, reply) => {
			const channel = await this.channelsRepository.findOneBy({
				id: request.params.channel,
			});

			if (channel) {
				const _channel = await this.channelEntityService.pack(channel);
				const meta = await this.metaService.fetch();
				reply.header('Cache-Control', 'public, max-age=15');
				return await reply.view('channel', {
					channel: _channel,
					instanceName: meta.name ?? 'Misskey',
					icon: meta.iconUrl,
					themeColor: meta.themeColor,
				});
			} else {
				return await renderBase(reply);
			}
		});
		//#endregion

		fastify.get('/_info_card_', async (request, reply) => {
			const meta = await this.metaService.fetch(true);

			reply.removeHeader('X-Frame-Options');

			return await reply.view('info-card', {
				version: this.config.version,
				host: this.config.host,
				meta: meta,
				originalUsersCount: await this.usersRepository.countBy({ host: IsNull() }),
				originalNotesCount: await this.notesRepository.countBy({ userHost: IsNull() }),
			});
		});

		fastify.get('/bios', async (request, reply) => {
			return await reply.view('bios', {
				version: this.config.version,
			});
		});

		fastify.get('/cli', async (request, reply) => {
			return await reply.view('cli', {
				version: this.config.version,
			});
		});

		const override = (source: string, target: string, depth = 0) =>
			[, ...target.split('/').filter(x => x), ...source.split('/').filter(x => x).splice(depth)].join('/');

		fastify.get('/flush', async (request, reply) => {
			return await reply.view('flush');
		});

		// streamingに非WebSocketリクエストが来た場合にbase htmlをキャシュ付きで返すと、Proxy等でそのパスがキャッシュされておかしくなる
		fastify.get('/streaming', async (request, reply) => {
			reply.code(503);
			reply.header('Cache-Control', 'private, max-age=0');
		});

		// Render base html for all requests
		fastify.get('*', async (request, reply) => {
			return await renderBase(reply);
		});

		fastify.setErrorHandler(async (error, request, reply) => {
			const errId = uuid();
			this.clientLoggerService.logger.error(`Internal error occured in ${request.routerPath}: ${error.message}`, {
				path: request.routerPath,
				params: request.params,
				query: request.query,
				code: error.name,
				stack: error.stack,
				id: errId,
			});
			reply.code(500);
			reply.header('Cache-Control', 'max-age=10, must-revalidate');
			return await reply.view('error', {
				code: error.code,
				id: errId,
			});
		});

		done();
	}
}
