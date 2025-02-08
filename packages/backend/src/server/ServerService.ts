/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import Fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyRawBody from 'fastify-raw-body';
import { IsNull } from 'typeorm';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { Config } from '@/config.js';
import type { EmojisRepository, MiMeta, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import type Logger from '@/logger.js';
import * as Acct from '@/misc/acct.js';
import { genIdenticon } from '@/misc/gen-identicon.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { bindThis } from '@/decorators.js';
import { ActivityPubServerService } from './ActivityPubServerService.js';
import { NodeinfoServerService } from './NodeinfoServerService.js';
import { ApiServerService } from './api/ApiServerService.js';
import { StreamingApiServerService } from './api/StreamingApiServerService.js';
import { WellKnownServerService } from './WellKnownServerService.js';
import { FileServerService } from './FileServerService.js';
import { HealthServerService } from './HealthServerService.js';
import { ClientServerService } from './web/ClientServerService.js';
import { OpenApiServerService } from './api/openapi/OpenApiServerService.js';
import { OAuth2ProviderService } from './oauth/OAuth2ProviderService.js';

const _dirname = fileURLToPath(new URL('.', import.meta.url));

@Injectable()
export class ServerService implements OnApplicationShutdown {
	private logger: Logger;
	#fastify: FastifyInstance;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private userEntityService: UserEntityService,
		private apiServerService: ApiServerService,
		private openApiServerService: OpenApiServerService,
		private streamingApiServerService: StreamingApiServerService,
		private activityPubServerService: ActivityPubServerService,
		private wellKnownServerService: WellKnownServerService,
		private nodeinfoServerService: NodeinfoServerService,
		private fileServerService: FileServerService,
		private healthServerService: HealthServerService,
		private clientServerService: ClientServerService,
		private globalEventService: GlobalEventService,
		private loggerService: LoggerService,
		private oauth2ProviderService: OAuth2ProviderService,
	) {
		this.logger = this.loggerService.getLogger('server', 'gray');
	}

	@bindThis
	public async launch(): Promise<void> {
		const fastify = Fastify({
			trustProxy: true,
			logger: false,
		});
		this.#fastify = fastify;

		// HSTS
		// 6months (15552000sec)
		if (this.config.url.startsWith('https') && !this.config.disableHsts) {
			fastify.addHook('onRequest', (request, reply, done) => {
				reply.header('strict-transport-security', 'max-age=15552000; preload');
				done();
			});
		}

		// Register raw-body parser for ActivityPub HTTP signature validation.
		await fastify.register(fastifyRawBody, {
			global: false,
			encoding: null,
			runFirst: true,
		});

		// Register non-serving static server so that the child services can use reply.sendFile.
		// `root` here is just a placeholder and each call must use its own `rootPath`.
		fastify.register(fastifyStatic, {
			root: _dirname,
			serve: false,
		});

		fastify.register(this.apiServerService.createServer, { prefix: '/api' });
		fastify.register(this.openApiServerService.createServer);
		fastify.register(this.fileServerService.createServer);
		fastify.register(this.activityPubServerService.createServer);
		fastify.register(this.nodeinfoServerService.createServer);
		fastify.register(this.wellKnownServerService.createServer);
		fastify.register(this.oauth2ProviderService.createServer, { prefix: '/oauth' });
		fastify.register(this.oauth2ProviderService.createTokenServer, { prefix: '/oauth/token' });
		fastify.register(this.healthServerService.createServer, { prefix: '/healthz' });

		fastify.get<{ Params: { path: string }; Querystring: { static?: any; badge?: any; }; }>('/emoji/:path(.*)', async (request, reply) => {
			const path = request.params.path;

			reply.header('Cache-Control', 'public, max-age=86400');

			if (!path.match(/^[a-zA-Z0-9\-_@\.]+?\.webp$/)) {
				reply.code(404);
				return;
			}

			const emojiPath = path.replace(/\.webp$/i, '');
			const pathChunks = emojiPath.split('@');

			if (pathChunks.length > 2) {
				reply.code(400);
				return;
			}

			const name = pathChunks.shift();
			const host = pathChunks.pop();

			const emoji = await this.emojisRepository.findOneBy({
				// `@.` is the spec of ReactionService.decodeReaction
				host: (host === undefined || host === '.') ? IsNull() : host,
				name: name,
			});

			reply.header('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');

			if (emoji == null) {
				if ('fallback' in request.query) {
					return await reply.redirect('/static-assets/emoji-unknown.png');
				} else {
					reply.code(404);
					return;
				}
			}

			let url: URL;
			if ('badge' in request.query) {
				url = new URL(`${this.config.mediaProxy}/emoji.png`);
				// || emoji.originalUrl してるのは後方互換性のため（publicUrlはstringなので??はだめ）
				url.searchParams.set('url', emoji.publicUrl || emoji.originalUrl);
				url.searchParams.set('badge', '1');
			} else {
				url = new URL(`${this.config.mediaProxy}/emoji.webp`);
				// || emoji.originalUrl してるのは後方互換性のため（publicUrlはstringなので??はだめ）
				url.searchParams.set('url', emoji.publicUrl || emoji.originalUrl);
				url.searchParams.set('emoji', '1');
				if ('static' in request.query) url.searchParams.set('static', '1');
			}

			return await reply.redirect(
				url.toString(),
				301,
			);
		});

		fastify.get<{ Params: { acct: string } }>('/avatar/@:acct', async (request, reply) => {
			const { username, host } = Acct.parse(request.params.acct);
			const user = await this.usersRepository.findOne({
				where: {
					usernameLower: username.toLowerCase(),
					host: (host == null) || (host === this.config.host) ? IsNull() : host,
					isSuspended: false,
				},
			});

			reply.header('Cache-Control', 'public, max-age=86400');

			if (user) {
				reply.redirect(user.avatarUrl ?? this.userEntityService.getIdenticonUrl(user));
			} else {
				reply.redirect('/static-assets/user-unknown.png');
			}
		});

		fastify.get<{ Params: { x: string } }>('/identicon/:x', async (request, reply) => {
			reply.header('Content-Type', 'image/png');
			reply.header('Cache-Control', 'public, max-age=86400');

			if (this.meta.enableIdenticonGeneration) {
				return await genIdenticon(request.params.x);
			} else {
				return reply.redirect('/static-assets/avatar.png');
			}
		});

		fastify.get<{ Params: { code: string } }>('/verify-email/:code', async (request, reply) => {
			const profile = await this.userProfilesRepository.findOneBy({
				emailVerifyCode: request.params.code,
			});

			if (profile != null) {
				await this.userProfilesRepository.update({ userId: profile.userId }, {
					emailVerified: true,
					emailVerifyCode: null,
				});

				this.globalEventService.publishMainStream(profile.userId, 'meUpdated', await this.userEntityService.pack(profile.userId, { id: profile.userId }, {
					schema: 'MeDetailed',
					includeSecrets: true,
				}));

				reply.code(200)
					.header('content-type', 'text/html; charset=utf-8')
					.send(mailVerifyPage('success', 'Verification succeeded!\n您的邮箱已成功验证\nメールアドレスの認証に成功しました'),
					);
				return;
			} else {
				reply.code(404)
					.header('content-type', 'text/html; charset=utf-8')
					.send(mailVerifyPage('failure', 'Verification failed!\n邮箱验证失败\nメールアドレスの認証に失敗しました'));
				return;
			}
		});

		fastify.register(this.clientServerService.createServer);

		this.streamingApiServerService.attach(fastify.server);

		fastify.server.on('error', err => {
			switch ((err as any).code) {
				case 'EACCES':
					this.logger.error(`You do not have permission to listen on port ${this.config.port}.`);
					break;
				case 'EADDRINUSE':
					this.logger.error(`Port ${this.config.port} is already in use by another process.`);
					break;
				default:
					this.logger.error(err);
					break;
			}

			if (cluster.isWorker) {
				process.send!('listenFailed');
			} else {
				// disableClustering
				process.exit(1);
			}
		});

		if (this.config.socket) {
			if (fs.existsSync(this.config.socket)) {
				fs.unlinkSync(this.config.socket);
			}
			fastify.listen({ path: this.config.socket }, (err, address) => {
				if (this.config.chmodSocket) {
					fs.chmodSync(this.config.socket!, this.config.chmodSocket);
				}
			});
		} else {
			fastify.listen({ port: this.config.port, host: '0.0.0.0' });
		}

		await fastify.ready();
	}

	@bindThis
	public async dispose(): Promise<void> {
		await this.streamingApiServerService.detach();
		await this.#fastify.close();
	}

	@bindThis
	async onApplicationShutdown(signal: string): Promise<void> {
		await this.dispose();
	}
}

const mailVerifyPage = (status: 'success' | 'failure', text: string) => {
	// 根据状态获取图标和颜色配置
	const {
		icon,
		primaryColor,
		secondaryColor,
		accentColor,
		titleText,
	} = status === 'success'
		? {
			icon: 'mingcute:check-fill',
			primaryColor: '#77DD77',
			secondaryColor: '#77BBDD',
			accentColor: '#FFDD88',
			titleText: 'VERIFICATION SUCCESS',
		}
		: {
			icon: 'mingcute:close-fill',
			primaryColor: '#FF8899',
			secondaryColor: '#7777AA',
			accentColor: '#FFDD88',
			titleText: 'VERIFICATION FAILED',
		};

	// 处理多语言换行和转义
	const formattedContent = text
		.split('\n')
		.map(line => `<p class="text-sm md:text-base leading-relaxed text-center">${line}</p>`)
		.join('');

	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titleText}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');

        body {
            font-family: 'Poppins', sans-serif;
        }

        [v-cloak] { display: none; }
        @keyframes icon-appear {
            0% { transform: scale(0); opacity: 0; }
            80% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }
        .icon-container {
            animation: icon-appear 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        }
        .bg-pattern {
            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${accentColor.substr(1)}' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
    </style>
</head>
<body class="bg-gradient-to-br from-[${primaryColor}] to-[${secondaryColor}] bg-pattern min-h-screen flex items-center justify-center p-4">
    <main class="max-w-md w-full">
        <div class="bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl p-8 transition-all duration-300 hover:shadow-3xl transform hover:-translate-y-1">
            <!-- 图标容器 -->
            <div class="bg-[${primaryColor}] w-24 h-24 rounded-full icon-container flex items-center justify-center mx-auto mb-8 shadow-lg">
                <iconify-icon
                    icon="${icon}"
                    class="text-white"
                    width="56"
                    height="56"
                    style="transform: translateY(2px)"
                ></iconify-icon>
            </div>

            <!-- 标题 -->
            <h1 class="text-3xl font-bold text-center text-[${primaryColor}] mb-6 tracking-wide">
                ${titleText}
            </h1>

            <!-- 多语言内容 -->
            <div class="space-y-3 mb-10 text-gray-600">
                ${formattedContent}
            </div>

            <!-- 返回按钮 -->
            <a href="/" class="
                block w-full bg-[${primaryColor}] text-white text-center
                py-4 px-6 rounded-full font-semibold text-lg transition-all duration-300
                hover:bg-[${secondaryColor}] hover:shadow-md hover:transform hover:scale-[0.98]
                active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${accentColor}]
            ">
                返回首页
            </a>
        </div>
    </main>

    <!-- 装饰元素 -->
    <div class="fixed top-4 left-4 w-16 h-16 bg-[${accentColor}] rounded-full opacity-20"></div>
    <div class="fixed bottom-4 right-4 w-24 h-24 bg-[${secondaryColor}] rounded-full opacity-20"></div>
</body>
</html>`;
};
