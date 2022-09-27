import { Inject, Injectable } from '@nestjs/common';
import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { ModuleRef, repl } from '@nestjs/core';
import type { Config } from '@/config.js';
import type { UsersRepository, InstancesRepository, AccessTokensRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import endpoints, { IEndpoint } from './endpoints.js';
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

	public createServer(fastify: FastifyInstance) {
		fastify.register(cors, {
			origin: '*',
		});

		fastify.register(multipart, {
			limits: {
				fileSize: this.config.maxFileSize ?? 262144000,
				files: 1,
			},
		});

		// Prevent cache
		fastify.addHook('onRequest', (request, reply, done) => {
			reply.header('Cache-Control', 'private, max-age=0, must-revalidate');
			done();
		});

		const endpointsMap = new Map<string, IEndpoint & { exec: any }>();

		for (const endpoint of endpoints) {
			endpointsMap.set(endpoint.name.replace(/-/g, '_'), {
				name: endpoint.name,
				meta: endpoint.meta,
				params: endpoint.params,
				exec: this.moduleRef.get('ep:' + endpoint.name, { strict: false }).exec,
			});
		}

		fastify.all<{
			Params: { endpoint: string; },
			Body: Record<string, unknown>,
			Querystring: Record<string, unknown>,
		}>('/api/:endpoint(.*)', (request, reply) => {
			const endpoint = endpointsMap.get(request.params.endpoint);
			if (endpoint == null) {
				reply.code(404);
				return;
			}
			if (request.method === 'GET' && !endpoint.meta.allowGet) {
				reply.code(405);
				return;
			}

			this.apiCallService.handleRequest(endpoint, request, reply);
		});

		fastify.post('/signup', ctx => this.signupApiServiceService.signup(ctx));
		fastify.post('/signin', ctx => this.signinApiServiceService.signin(ctx));
		fastify.post('/signup-pending', ctx => this.signupApiServiceService.signupPending(ctx));

		router.use(this.discordServerService.create().routes());
		router.use(this.githubServerService.create().routes());
		router.use(this.twitterServerService.create().routes());

		fastify.get('/v1/instance/peers', async (request, reply) => {
			const instances = await this.instancesRepository.find({
				select: ['host'],
			});

			ctx.body = instances.map(instance => instance.host);
		});

		fastify.post<{ Params: { session: string; } }>('/miauth/:session/check', async (request, reply) => {
			const token = await this.accessTokensRepository.findOneBy({
				session: request.params.session,
			});

			if (token && token.session != null && !token.fetched) {
				this.accessTokensRepository.update(token.id, {
					fetched: true,
				});

				reply.send({
					ok: true,
					token: token.token,
					user: await this.userEntityService.pack(token.userId, null, { detail: true }),
				});
			} else {
				reply.send({
					ok: false,
				});
			}
		});

		// Return 404 for unknown API
		fastify.all('*', (request, reply) => {
			reply.code(404);
		});

		// Register router
		apiServer.use(router.routes());
	}
}
