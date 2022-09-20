import { Inject, Injectable } from '@nestjs/common';
import Koa from 'koa';
import Router from '@koa/router';
import multer from '@koa/multer';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import { ModuleRef } from '@nestjs/core';
import type { Config } from '@/config.js';
import type { UsersRepository, InstancesRepository, AccessTokensRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import endpoints from './endpoints.js';
import { ApiCallService } from './ApiCallService.js';
import { SignupApiService } from './SignupApiService.js';
import { SigninApiService } from './SigninApiService.js';
import { GithubServerService } from './integration/GithubServerService.js';
import { DiscordServerService } from './integration/DiscordServerService.js';
import { TwitterServerService } from './integration/TwitterServerService.js';

@Injectable()
export class ApiServerService {
	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private userEntityService: UserEntityService,
		private apiCallService: ApiCallService,
		private signupApiServiceService: SignupApiService,
		private signinApiServiceService: SigninApiService,
		private githubServerService: GithubServerService,
		private discordServerService: DiscordServerService,
		private twitterServerService: TwitterServerService,
	) {
	}

	public createApiServer() {
		const handlers: Record<string, any> = {};

		for (const endpoint of endpoints) {
			handlers[endpoint.name] = this.moduleRef.get('ep:' + endpoint.name, { strict: false }).exec;
		}

		// Init app
		const apiServer = new Koa();

		apiServer.use(cors({
			origin: '*',
		}));

		// No caching
		apiServer.use(async (ctx, next) => {
			ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
			await next();
		});

		apiServer.use(bodyParser({
			// リクエストが multipart/form-data でない限りはJSONだと見なす
			detectJSON: ctx => !ctx.is('multipart/form-data'),
		}));

		// Init multer instance
		const upload = multer({
			storage: multer.diskStorage({}),
			limits: {
				fileSize: this.config.maxFileSize ?? 262144000,
				files: 1,
			},
		});

		// Init router
		const router = new Router();

		/**
		 * Register endpoint handlers
		 */
		for (const endpoint of endpoints) {
			if (endpoint.meta.requireFile) {
				router.post(`/${endpoint.name}`, upload.single('file'), this.apiCallService.handleRequest.bind(this.apiCallService, endpoint, handlers[endpoint.name]));
			} else {
				// 後方互換性のため
				if (endpoint.name.includes('-')) {
					router.post(`/${endpoint.name.replace(/-/g, '_')}`, this.apiCallService.handleRequest.bind(this.apiCallService, endpoint, handlers[endpoint.name]));

					if (endpoint.meta.allowGet) {
						router.get(`/${endpoint.name.replace(/-/g, '_')}`, this.apiCallService.handleRequest.bind(this.apiCallService, endpoint, handlers[endpoint.name]));
					} else {
						router.get(`/${endpoint.name.replace(/-/g, '_')}`, async ctx => { ctx.status = 405; });
					}
				}

				router.post(`/${endpoint.name}`, this.apiCallService.handleRequest.bind(this.apiCallService, endpoint, handlers[endpoint.name]));

				if (endpoint.meta.allowGet) {
					router.get(`/${endpoint.name}`, this.apiCallService.handleRequest.bind(this.apiCallService, endpoint, handlers[endpoint.name]));
				} else {
					router.get(`/${endpoint.name}`, async ctx => { ctx.status = 405; });
				}
			}
		}

		router.post('/signup', ctx => this.signupApiServiceService.signup(ctx));
		router.post('/signin', ctx => this.signinApiServiceService.signin(ctx));
		router.post('/signup-pending', ctx => this.signupApiServiceService.signupPending(ctx));

		router.use(this.discordServerService.create().routes());
		router.use(this.githubServerService.create().routes());
		router.use(this.twitterServerService.create().routes());

		router.get('/v1/instance/peers', async ctx => {
			const instances = await this.instancesRepository.find({
				select: ['host'],
			});

			ctx.body = instances.map(instance => instance.host);
		});

		router.post('/miauth/:session/check', async ctx => {
			const token = await this.accessTokensRepository.findOneBy({
				session: ctx.params.session,
			});

			if (token && token.session != null && !token.fetched) {
				this.accessTokensRepository.update(token.id, {
					fetched: true,
				});

				ctx.body = {
					ok: true,
					token: token.token,
					user: await this.userEntityService.pack(token.userId, null, { detail: true }),
				};
			} else {
				ctx.body = {
					ok: false,
				};
			}
		});

		// Return 404 for unknown API
		router.all('(.*)', async ctx => {
			ctx.status = 404;
		});

		// Register router
		apiServer.use(router.routes());

		return apiServer;
	}
}
