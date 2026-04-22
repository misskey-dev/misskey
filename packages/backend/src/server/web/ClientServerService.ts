/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import sharp from 'sharp';
import { In, IsNull } from 'typeorm';
import { Hono } from 'hono';
import { every } from 'hono/combine';
import { proxy } from 'hono/proxy';
import { serveStatic } from '@hono/node-server/serve-static';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import * as Acct from '@/misc/acct.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { PageEntityService } from '@/core/entities/PageEntityService.js';
import { GalleryPostEntityService } from '@/core/entities/GalleryPostEntityService.js';
import { ClipEntityService } from '@/core/entities/ClipEntityService.js';
import { ChannelEntityService } from '@/core/entities/ChannelEntityService.js';
import type {
	AnnouncementsRepository,
	ChannelsRepository,
	ClipsRepository,
	FlashsRepository,
	GalleryPostsRepository,
	MiMeta,
	NotesRepository,
	PagesRepository,
	ReversiGamesRepository,
	UserProfilesRepository,
	UsersRepository,
} from '@/models/_.js';
import { handleRequestRedirectToOmitSearch } from '@/misc/hono-middleware-handlers.js';
import { vary } from '@/misc/hono-vary.js';
import { htmlSafeJsonStringify } from '@/misc/json-stringify-html-safe.js';
import { bindThis } from '@/decorators.js';
import { FlashEntityService } from '@/core/entities/FlashEntityService.js';
import { ReversiGameEntityService } from '@/core/entities/ReversiGameEntityService.js';
import { AnnouncementEntityService } from '@/core/entities/AnnouncementEntityService.js';
import { ApiError } from '@/server/api/error.js';
import { FeedService } from './FeedService.js';
import { UrlPreviewService } from './UrlPreviewService.js';
import { ClientLoggerService } from './ClientLoggerService.js';
import { HtmlTemplateService } from './HtmlTemplateService.js';

import { BasePage } from './views/base.js';
import { UserPage } from './views/user.js';
import { NotePage } from './views/note.js';
import { PagePage } from './views/page.js';
import { ClipPage } from './views/clip.js';
import { FlashPage } from './views/flash.js';
import { GalleryPostPage } from './views/gallery-post.js';
import { ChannelPage } from './views/channel.js';
import { ReversiGamePage } from './views/reversi-game.js';
import { AnnouncementPage } from './views/announcement.js';
import { BaseEmbed } from './views/base-embed.js';
import { InfoCardPage } from './views/info-card.js';
import { BiosPage } from './views/bios.js';
import { CliPage } from './views/cli.js';
import { FlushPage } from './views/flush.js';
import { ErrorPage } from './views/error.js';

import type { Context as HonoContext } from 'hono';

@Injectable()
export class ClientServerService {
	private readonly staticAssets: string;
	private readonly clientAssets: string;
	private readonly assets: string;
	private readonly swAssets: string;
	private readonly fluentEmojisDir: string;
	private readonly twemojiDir: string;
	private readonly frontendViteOut: string;
	private readonly frontendEmbedViteOut: string;
	private readonly tarball: string;

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

		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,

		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		private flashEntityService: FlashEntityService,
		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,
		private pageEntityService: PageEntityService,
		private galleryPostEntityService: GalleryPostEntityService,
		private clipEntityService: ClipEntityService,
		private channelEntityService: ChannelEntityService,
		private reversiGameEntityService: ReversiGameEntityService,
		private announcementEntityService: AnnouncementEntityService,
		private urlPreviewService: UrlPreviewService,
		private feedService: FeedService,
		private htmlTemplateService: HtmlTemplateService,
		private clientLoggerService: ClientLoggerService,
	) {
		//this.createServer = this.createServer.bind(this);
		const backendRootdir = resolve(this.config.rootDir, 'packages/backend');
		const frontendRootdir = resolve(this.config.rootDir, 'packages/frontend');
		this.staticAssets = resolve(backendRootdir, 'assets');
		this.clientAssets = resolve(frontendRootdir, 'assets');
		this.assets = resolve(this.config.rootDir, 'built/_frontend_dist_');
		this.swAssets = resolve(this.config.rootDir, 'built/_sw_dist_');
		this.fluentEmojisDir = resolve(this.config.rootDir, 'fluent-emojis/dist');
		this.twemojiDir = resolve(backendRootdir, 'node_modules/@discordapp/twemoji/dist/svg');
		this.frontendViteOut = resolve(this.config.rootDir, 'built/_frontend_vite_');
		this.frontendEmbedViteOut = resolve(this.config.rootDir, 'built/_frontend_embed_vite_');
		this.tarball = resolve(this.config.rootDir, 'built/tarball');
	}

	@bindThis
	private async manifestHandler(ctx: HonoContext) {
		let manifest = {
			// 空文字列の場合右辺を使いたいため
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			'short_name': this.meta.shortName || this.meta.name || this.config.host,
			// 空文字列の場合右辺を使いたいため
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			'name': this.meta.name || this.config.host,
			'start_url': '/',
			'display': 'standalone',
			'background_color': '#313a42',
			// 空文字列の場合右辺を使いたいため
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			'theme_color': this.meta.themeColor || '#86b300',
			'icons': [{
				// 空文字列の場合右辺を使いたいため
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				'src': this.meta.app192IconUrl || '/static-assets/icons/192.png',
				'sizes': '192x192',
				'type': 'image/png',
				'purpose': 'maskable',
			}, {
				// 空文字列の場合右辺を使いたいため
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				'src': this.meta.app512IconUrl || '/static-assets/icons/512.png',
				'sizes': '512x512',
				'type': 'image/png',
				'purpose': 'maskable',
			}, {
				'src': '/static-assets/splash.png',
				'sizes': '300x300',
				'type': 'image/png',
				'purpose': 'any',
			}],
			'share_target': {
				'action': '/share/',
				'method': 'GET',
				'enctype': 'application/x-www-form-urlencoded',
				'params': {
					'title': 'title',
					'text': 'text',
					'url': 'url',
				},
			},
			'shortcuts': [{
				'name': 'Safemode',
				'url': '/?safemode=true',
			}],
		};

		manifest = {
			...manifest,
			...JSON.parse(this.meta.manifestJsonOverride === '' ? '{}' : this.meta.manifestJsonOverride),
		};

		ctx.header('Cache-Control', 'max-age=300');
		return ctx.json(manifest);
	}

	@bindThis
	public createServer(): Hono {
		const hono = new Hono();
		const configUrl = new URL(this.config.url);

		hono.use(async (ctx, next) => {
			if (
				!ctx.req.path.startsWith('/embed/') &&
				!ctx.req.path.startsWith('/_info_card_')
			) {
				// クリックジャッキング防止のためiFrameの中に入れられないようにする
				ctx.header('X-Frame-Options', 'DENY');
			}

			await next();
		});

		//#region vite assets
		if (this.config.frontendEmbedManifestExists) {
			this.clientLoggerService.logger.info(`[ClientServerService] Using built frontend vite assets. ${this.frontendViteOut}`);
			hono.get('/vite/*', serveStatic({
				root: this.frontendViteOut,
			}), every(
				handleRequestRedirectToOmitSearch,
				async (ctx, next) => {
					ctx.header('Cache-Control', `max-age=${ms('30 days') / 1000}, immutable`);
					await next();
				},
			));
			hono.get('/embed_vite/*', serveStatic({
				root: this.frontendEmbedViteOut,
			}), every(
				handleRequestRedirectToOmitSearch,
				async (ctx, next) => {
					ctx.header('Cache-Control', `max-age=${ms('30 days') / 1000}, immutable`);
					await next();
				},
			));
		} else {
			console.log('[ClientServerService] Proxying to Vite dev server.');
			const urlOriginWithoutPort = configUrl.origin.replace(/:\d+$/, '');

			const port = (process.env.VITE_PORT ?? '5173');
			hono.get('/vite/*', (ctx) => {
				return proxy(`${urlOriginWithoutPort}:${port}${ctx.req.path}`);
			});

			const embedPort = (process.env.EMBED_VITE_PORT ?? '5174');
			hono.get('/embed_vite/*', (ctx) => {
				return proxy(`${urlOriginWithoutPort}:${embedPort}${ctx.req.path}`);
			});
		}
		//#endregion

		//#region static assets

		hono.get('/static-assets/*', serveStatic({
			root: this.staticAssets,
		}), async (ctx, next) => {
			ctx.header('Cache-Control', `max-age=${ms('7 days') / 1000}`);
			await next();
		});

		hono.get('/client-assets/*', serveStatic({
			root: this.clientAssets,
		}), async (ctx, next) => {
			ctx.header('Cache-Control', `max-age=${ms('7 days') / 1000}`);
			await next()
		});

		hono.get('/assets/*', serveStatic({
			root: this.assets,
		}), async (ctx, next) => {
			ctx.header('Cache-Control', `max-age=${ms('7 days') / 1000}`);
			await next()
		});

		hono.get('/tarball/*', serveStatic({
			root: this.tarball,
		}), every(
			handleRequestRedirectToOmitSearch,
			async (ctx, next) => {
				ctx.header('Cache-Control', `max-age=${ms('30 days') / 1000}, immutable`);
				await next();
			},
		));

		hono.get('/favicon.ico', serveStatic({
			path: resolve(this.staticAssets, 'favicon.ico'),
		}));

		hono.get('/apple-touch-icon.png', serveStatic({
			path: resolve(this.staticAssets, 'apple-touch-icon.png'),
		}));

		hono.get('/fluent-emoji/:filename{[0-9a-f-]+\\.png}', serveStatic({
			root: this.fluentEmojisDir,
		}), async (ctx, next) => {
			ctx.header('Cache-Control', `max-age=${ms('30 days') / 1000}`);
			await next();
		});

		hono.get('/twemoji/:filename{[0-9a-f-]+\\.svg}', serveStatic({
			root: this.twemojiDir,
		}), async (ctx, next) => {
			ctx.header('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');
			
			ctx.header('Cache-Control', `max-age=${ms('30 days') / 1000}`);
			await next();
		});

		hono.get('/twemoji-badge/:filename{[0-9a-f-]+\\.png}', async (ctx) => {
			const filename = ctx.req.param('filename');
			const path = resolve(this.twemojiDir, `${filename.replace('.png', '')}.svg`);
			const mask = await sharp(path, { density: 1000 })
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

			ctx.header('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');
			ctx.header('Cache-Control', `max-age=${ms('30 days') / 1000}`);
			ctx.header('Content-Type', 'image/png');
			return ctx.body(new Uint8Array(buffer));
		});

		// ServiceWorker
		hono.get('/sw.js', serveStatic({
			path: resolve(this.swAssets, 'sw.js'),
		}));

		// Manifest
		hono.get('/manifest.json', async (ctx) => await this.manifestHandler(ctx));

		// Embed Javascript
		hono.get('/embed.js', serveStatic({
			path: resolve(this.staticAssets, 'embed.js'),
		}));

		hono.get('/robots.txt', async (ctx) => {
			const disallowedPaths = [
				'/settings',
				'/admin',
				'/custom-emojis-manager',
				'/avatar-decorations',
				'/share',
				'/my',
				'/api',
				'/inbox',
				'/oauth',
				'/proxy',
				'/url',
			];

			if (this.meta.ugcVisibilityForVisitor === 'none') {
				disallowedPaths.push(
					'/@',
					'/notes',
				);
			}

			let content = `User-agent: *\n`;
			content += disallowedPaths.map((path) => `Disallow: ${path}`).join('\n') + '\n';
			content += 'Allow: /\n';
			content += '\n# todo: sitemap\n';

			return ctx.text(content);
		});

		// OpenSearch XML
		hono.get('/opensearch.xml', async (ctx) => {
			const name = this.meta.name ?? 'Misskey';
			let content = '';
			content += '<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/" xmlns:moz="http://www.mozilla.org/2006/browser/search/">';
			content += `<ShortName>${name}</ShortName>`;
			content += `<Description>${name} Search</Description>`;
			content += '<InputEncoding>UTF-8</InputEncoding>';
			content += `<Image width="16" height="16" type="image/x-icon">${this.config.url}/favicon.ico</Image>`;
			content += `<Url type="text/html" template="${this.config.url}/search?q={searchTerms}"/>`;
			content += '</OpenSearchDescription>';

			ctx.header('Content-Type', 'application/opensearchdescription+xml');
			return ctx.body(content);
		});

		//#endregion

		const renderBase = async (ctx: HonoContext, data: Partial<Parameters<typeof BasePage>[0]> = {}) => {
			ctx.header('Cache-Control', 'public, max-age=30');
			return ctx.html(BasePage({
				img: this.meta.bannerUrl ?? undefined,
				title: this.meta.name ?? 'Misskey',
				desc: this.meta.description ?? undefined,
				...await this.htmlTemplateService.getCommonData(),
				...data,
			}));
		};

		const renderEmbedBase = async (ctx: HonoContext, data: Partial<Parameters<typeof BaseEmbed>[0]> = {}) => {
			ctx.header('Cache-Control', 'public, max-age=30');
			return ctx.html(BaseEmbed({
				title: this.meta.name ?? 'Misskey',
				...await this.htmlTemplateService.getCommonData(),
				...data,
			}));
		};

		// URL preview endpoint
		hono.get('/url', (c) => this.urlPreviewService.handle(c));

		const getFeed = async (acct: string) => {
			const { username, host } = Acct.parse(acct);
			const user = await this.usersRepository.findOneBy({
				usernameLower: username.toLowerCase(),
				host: host ?? IsNull(),
				isSuspended: false,
				requireSigninToViewContents: false,
			});

			return user && await this.feedService.packFeed(user);
		};

		// Atom
		hono.get('/@:user.atom', async (ctx) => {
			const user = ctx.req.param('user');
			if (user == null) return await renderBase(ctx);

			const feed = await getFeed(user);

			if (feed) {
				ctx.header('Content-Type', 'application/atom+xml; charset=utf-8');
				return ctx.body(feed.atom1());
			} else {
				ctx.status(404);
				return;
			}
		});

		// RSS
		hono.get('/@:user.rss', async (ctx) => {
			const user = ctx.req.param('user');
			if (user == null) return await renderBase(ctx);

			const feed = await getFeed(user);

			if (feed) {
				ctx.header('Content-Type', 'application/rss+xml; charset=utf-8');
				return ctx.body(feed.rss2());
			} else {
				ctx.status(404);
				return;
			}
		});

		// JSON
		hono.get('/@:user.json', async (ctx) => {
			const user = ctx.req.param('user');
			if (user == null) return await renderBase(ctx);

			const feed = await getFeed(user);

			if (feed) {
				ctx.header('Content-Type', 'application/json; charset=utf-8');
				return ctx.json(feed.json1());
			} else {
				ctx.status(404);
				return;
			}
		});

		//#region SSR
		// User
		hono.get('/@:user/:sub?', async (ctx) => {
			const userParam = ctx.req.param('user');
			if (userParam == null) return await renderBase(ctx);

			const { username, host } = Acct.parse(userParam);
			const user = await this.usersRepository.findOneBy({
				usernameLower: username.toLowerCase(),
				host: host ?? IsNull(),
				isSuspended: false,
			});

			vary(ctx, 'Accept');

			if (
				user != null && (
					this.meta.ugcVisibilityForVisitor === 'all' ||
						(this.meta.ugcVisibilityForVisitor === 'local' && user.host == null)
				)
			) {
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

				ctx.header('Cache-Control', 'public, max-age=15');
				if (profile.preventAiLearning) {
					ctx.header('X-Robots-Tag', 'noimageai');
					ctx.header('X-Robots-Tag', 'noai');
				}

				const _user = await this.userEntityService.pack(user, null, {
					schema: 'UserDetailed',
					userProfile: profile,
				});

				return ctx.html(UserPage({
					user: _user,
					profile,
					sub: ctx.req.param('sub'),
					...await this.htmlTemplateService.getCommonData(),
					clientCtxJson: htmlSafeJsonStringify({
						user: _user,
					}),
				}));
			} else {
				// リモートユーザーなので
				// モデレータがAPI経由で参照可能にするために404にはしない
				return await renderBase(ctx);
			}
		});

		hono.get('/users/:user', async (ctx) => {
			const userParam = ctx.req.param('user');
			if (userParam == null) return await renderBase(ctx);

			const user = await this.usersRepository.findOneBy({
				id: userParam,
				host: IsNull(),
				isSuspended: false,
			});

			if (user == null) {
				ctx.status(404);
				return;
			}

			vary(ctx, 'Accept');

			return ctx.redirect(`/@${user.username}${ user.host == null ? '' : '@' + user.host}`);
		});

		// Note
		hono.get('/notes/:note', async (ctx) => {
			vary(ctx, 'Accept');

			const noteId = ctx.req.param('note');
			if (noteId == null) return await renderBase(ctx);

			const note = await this.notesRepository.findOne({
				where: {
					id: noteId,
					visibility: In(['public', 'home']),
				},
				relations: ['user', 'reply', 'renote'],
			});

			if (
				note &&
				!note.user!.requireSigninToViewContents &&
				(this.meta.ugcVisibilityForVisitor === 'all' ||
					(this.meta.ugcVisibilityForVisitor === 'local' && note.userHost == null)
				)
			) {
				const _note = await this.noteEntityService.pack(note);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: note.userId });
				ctx.header('Cache-Control', 'public, max-age=15');
				if (profile.preventAiLearning) {
					ctx.header('X-Robots-Tag', 'noimageai');
					ctx.header('X-Robots-Tag', 'noai');
				}
				return ctx.html(NotePage({
					note: _note,
					profile,
					...await this.htmlTemplateService.getCommonData(),
					clientCtxJson: htmlSafeJsonStringify({
						note: _note,
					}),
				}));
			} else {
				return await renderBase(ctx);
			}
		});

		// Page
		hono.get('/@:user/pages/:page', async (ctx) => {
			const userParam = ctx.req.param('user');
			if (userParam == null) return await renderBase(ctx);

			const { username, host } = Acct.parse(userParam);
			const user = await this.usersRepository.findOneBy({
				usernameLower: username.toLowerCase(),
				host: host ?? IsNull(),
			});

			if (user == null) return;

			const page = await this.pagesRepository.findOneBy({
				name: ctx.req.param('page'),
				userId: user.id,
			});

			if (page) {
				const _page = await this.pageEntityService.pack(page);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: page.userId });
				if (['public'].includes(page.visibility)) {
					ctx.header('Cache-Control', 'public, max-age=15');
				} else {
					ctx.header('Cache-Control', 'private, max-age=0, must-revalidate');
				}
				if (profile.preventAiLearning) {
					ctx.header('X-Robots-Tag', 'noimageai');
					ctx.header('X-Robots-Tag', 'noai');
				}
				return ctx.html(PagePage({
					page: _page,
					profile,
					...await this.htmlTemplateService.getCommonData(),
				}));
			} else {
				return await renderBase(ctx);
			}
		});

		// Flash
		hono.get('/play/:id', async (ctx) => {
			const flashId = ctx.req.param('id');
			if (flashId == null) return await renderBase(ctx);

			const flash = await this.flashsRepository.findOneBy({
				id: flashId,
			});

			if (flash) {
				const _flash = await this.flashEntityService.pack(flash);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: flash.userId });
				ctx.header('Cache-Control', 'public, max-age=15');
				if (profile.preventAiLearning) {
					ctx.header('X-Robots-Tag', 'noimageai');
					ctx.header('X-Robots-Tag', 'noai');
				}
				return ctx.html(FlashPage({
					flash: _flash,
					profile,
					...await this.htmlTemplateService.getCommonData(),
				}));
			} else {
				return await renderBase(ctx);
			}
		});

		// Clip
		hono.get('/clips/:clip', async (ctx) => {
			const clipId = ctx.req.param('clip');
			if (clipId == null) return await renderBase(ctx);

			const clip = await this.clipsRepository.findOneBy({
				id: clipId,
			});

			if (clip && clip.isPublic) {
				const _clip = await this.clipEntityService.pack(clip);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: clip.userId });
				ctx.header('Cache-Control', 'public, max-age=15');
				if (profile.preventAiLearning) {
					ctx.header('X-Robots-Tag', 'noimageai');
					ctx.header('X-Robots-Tag', 'noai');
				}
				return ctx.html(ClipPage({
					clip: _clip,
					profile,
					...await this.htmlTemplateService.getCommonData(),
					clientCtxJson: htmlSafeJsonStringify({
						clip: _clip,
					}),
				}));
			} else {
				return await renderBase(ctx);
			}
		});

		// Gallery post
		hono.get('/gallery/:post', async (ctx) => {
			const postId = ctx.req.param('post');
			if (postId == null) return await renderBase(ctx);

			const post = await this.galleryPostsRepository.findOneBy({ id: postId });

			if (post) {
				const _post = await this.galleryPostEntityService.pack(post);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: post.userId });
				ctx.header('Cache-Control', 'public, max-age=15');
				if (profile.preventAiLearning) {
					ctx.header('X-Robots-Tag', 'noimageai');
					ctx.header('X-Robots-Tag', 'noai');
				}
				return ctx.html(GalleryPostPage({
					galleryPost: _post,
					profile,
					...await this.htmlTemplateService.getCommonData(),
				}));
			} else {
				return await renderBase(ctx);
			}
		});

		// Channel
		hono.get('/channels/:channel', async (ctx) => {
			const channelId = ctx.req.param('channel');
			if (channelId == null) return await renderBase(ctx);

			const channel = await this.channelsRepository.findOneBy({
				id: channelId,
			});

			if (channel) {
				const _channel = await this.channelEntityService.pack(channel);
				ctx.header('Cache-Control', 'public, max-age=15');
				return ctx.html(ChannelPage({
					channel: _channel,
					...await this.htmlTemplateService.getCommonData(),
				}));
			} else {
				return await renderBase(ctx);
			}
		});

		// Reversi game
		hono.get('/reversi/g/:game', async (ctx) => {
			const gameId = ctx.req.param('game');
			if (gameId == null) return await renderBase(ctx);

			const game = await this.reversiGamesRepository.findOneBy({
				id: gameId,
			});

			if (game) {
				const _game = await this.reversiGameEntityService.packDetail(game);
				ctx.header('Cache-Control', 'public, max-age=3600');
				return ctx.html(ReversiGamePage({
					reversiGame: _game,
					...await this.htmlTemplateService.getCommonData(),
				}));
			} else {
				return await renderBase(ctx);
			}
		});

		// 個別お知らせページ
		hono.get('/announcements/:announcementId', async (ctx) => {
			const announcementId = ctx.req.param('announcementId');
			if (announcementId == null) return await renderBase(ctx);

			const announcement = await this.announcementsRepository.findOneBy({
				id: announcementId,
				userId: IsNull(),
			});

			if (announcement) {
				const _announcement = await this.announcementEntityService.pack(announcement);
				ctx.header('Cache-Control', 'public, max-age=3600');
				return ctx.html(AnnouncementPage({
					announcement: _announcement,
					...await this.htmlTemplateService.getCommonData(),
				}));
			} else {
				return await renderBase(ctx);
			}
		});
		//#endregion

		//#region noindex pages
		// Tags
		hono.get('/tags/:tag', async (ctx) => {
			return await renderBase(ctx, { noindex: true });
		});

		// User with Tags
		hono.get('/user-tags/:tag', async (ctx) => {
			return await renderBase(ctx, { noindex: true });
		});
		//#endregion

		//#region embed pages
		hono.get('/embed/user-timeline/:user', async (ctx) => {
			const userId = ctx.req.param('user');
			if (userId == null) return await renderEmbedBase(ctx);

			const user = await this.usersRepository.findOneBy({
				id: userId,
			});

			if (user == null) return;
			if (user.host != null) return;

			const _user = await this.userEntityService.pack(user);

			ctx.header('Cache-Control', 'public, max-age=3600');
			return await renderEmbedBase(ctx, {
				embedCtxJson: htmlSafeJsonStringify({
					user: _user,
				}),
			});
		});

		hono.get('/embed/notes/:note', async (ctx) => {
			const noteId = ctx.req.param('note');
			if (noteId == null) return await renderEmbedBase(ctx);

			const note = await this.notesRepository.findOne({
				where: {
					id: noteId,
				},
				relations: ['user', 'reply', 'renote'],
			});

			if (note == null) return;
			if (['specified', 'followers'].includes(note.visibility)) return;
			if (note.userHost != null) return;

			const _note = await this.noteEntityService.pack(note, null, { detail: true });

			ctx.header('Cache-Control', 'public, max-age=3600');
			return await renderEmbedBase(ctx, {
				embedCtxJson: htmlSafeJsonStringify({
					note: _note,
				}),
			});
		});

		hono.get('/embed/clips/:clip', async (ctx) => {
			const clipId = ctx.req.param('clip');
			if (clipId == null) return await renderEmbedBase(ctx);

			const clip = await this.clipsRepository.findOneBy({
				id: clipId,
			});

			if (clip == null) return;

			const _clip = await this.clipEntityService.pack(clip);

			ctx.header('Cache-Control', 'public, max-age=3600');
			return await renderEmbedBase(ctx, {
				embedCtxJson: htmlSafeJsonStringify({
					clip: _clip,
				}),
			});
		});

		hono.get('/embed/*', async (ctx) => {
			ctx.header('Cache-Control', 'public, max-age=3600');
			return await renderEmbedBase(ctx);
		});

		hono.get('/_info_card_', async (ctx) => {
			return ctx.html(InfoCardPage({
				version: this.config.version,
				config: this.config,
				meta: this.meta,
			}));
		});
		//#endregion

		hono.get('/bios', async (ctx) => {
			return ctx.html(BiosPage({
				version: this.config.version,
			}));
		});

		hono.get('/cli', async (ctx) => {
			return ctx.html(CliPage({
				version: this.config.version,
			}));
		});

		hono.get('/flush', async (ctx) => {
			let sendHeader = true;

			const originHeader = ctx.req.header('Origin');
			if (originHeader != null) {
				const originURL = new URL(originHeader);
				if (originURL.protocol !== 'https:') { // Clear-Site-Data only supports https
					sendHeader = false;
				}
				if (originURL.host !== configUrl.host) {
					sendHeader = false;
				}
			}

			if (sendHeader) {
				ctx.header('Clear-Site-Data', '"*"');
			}
			ctx.header('Set-Cookie', 'http-flush-failed=1; Path=/flush; Max-Age=60');
			return ctx.html(FlushPage());
		});

		// streamingに非WebSocketリクエストが来た場合にbase htmlをキャシュ付きで返すと、Proxy等でそのパスがキャッシュされておかしくなる
		hono.get('/streaming', async (ctx) => {
			ctx.status(503);
			ctx.header('Cache-Control', 'private, max-age=0');
			return;
		});

		// Render base html for all requests
		hono.get('*', async (ctx) => {
			return await renderBase(ctx);
		});

		hono.onError(async (err, ctx) => {
			// ClientServerでも、RSS・JSONなどのエンドポイントでApiErrorが発生することがある
			if (err instanceof ApiError) {
				ctx.status(err.httpStatusCode ?? 500);
				ctx.header('Cache-Control', 'max-age=10, must-revalidate');

				// Must be synced with ApiCallService.send
				return ctx.json({
					error: {
						message: err.message,
						code: err.code,
						id: err.id,
						kind: err.kind,
						...(err.info ? { info: err.info } : {}),
					},
				});
			} else {
				const errId = randomUUID();
				this.clientLoggerService.logger.error(`Internal error occurred in ${ctx.req.path}: ${err.message}`, {
					path: ctx.req.path,
					params: ctx.req.param(),
					query: ctx.req.query(),
					code: err.name,
					stack: err.stack,
					id: errId,
				});
				ctx.status(500);
				ctx.header('Cache-Control', 'max-age=10, must-revalidate');
				return ctx.html(ErrorPage({
					code: err.name,
					id: errId,
				}));
			}
		});

		return hono;
	}
}
