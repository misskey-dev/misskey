import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyCookie from '@fastify/cookie';
import { getRequiredService } from 'yohira';
import { Inject, Injectable } from '@/di-decorators.js';
import type { Config } from '@/config.js';
import type { UsersRepository, InstancesRepository, AccessTokensRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { Schema } from '@/misc/schema.js';
import { endpoints } from '@/boot/EndpointsModule.js';
import { IEndpoint, IEndpointMeta } from './endpoints.js';
import { ApiCallService } from './ApiCallService.js';
import { SignupApiService } from './SignupApiService.js';
import { SigninApiService } from './SigninApiService.js';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { IServiceProvider } from 'yohira';

@Injectable()
export class ApiServerService {
	constructor(
		@Inject(Symbol.for('IServiceProvider'))
		private serviceProvider: IServiceProvider,

		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		@Inject(DI.UserEntityService)
		private userEntityService: UserEntityService,

		@Inject(DI.ApiCallService)
		private apiCallService: ApiCallService,

		@Inject(DI.SignupApiService)
		private signupApiService: SignupApiService,

		@Inject(DI.SigninApiService)
		private signinApiService: SigninApiService,
	) {
		//this.createServer = this.createServer.bind(this);
	}

	@bindThis
	public createServer(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		fastify.register(cors, {
			origin: '*',
		});

		fastify.register(multipart, {
			limits: {
				fileSize: this.config.maxFileSize ?? 262144000,
				files: 1,
			},
		});

		fastify.register(fastifyCookie, {});

		// Prevent cache
		fastify.addHook('onRequest', (request, reply, done) => {
			reply.header('Cache-Control', 'private, max-age=0, must-revalidate');
			done();
		});

		for (const endpoint of endpoints) {
			const ep = {
				name: endpoint.name,
				meta: endpoint.meta,
				params: endpoint.params,
				exec: getRequiredService<Endpoint<IEndpointMeta, Schema>>(this.serviceProvider, Symbol.for('ep:' + endpoint.name)).exec,
			};

			if (endpoint.meta.requireFile) {
				fastify.all<{
					Params: { endpoint: string; },
					Body: Record<string, unknown>,
					Querystring: Record<string, unknown>,
				}>('/' + endpoint.name, (request, reply) => {
					if (request.method === 'GET' && !endpoint.meta.allowGet) {
						reply.code(405);
						reply.send();
						return;
					}
		
					this.apiCallService.handleMultipartRequest(ep, request, reply);
				});
			} else {
				fastify.all<{
					Params: { endpoint: string; },
					Body: Record<string, unknown>,
					Querystring: Record<string, unknown>,
				}>('/' + endpoint.name, { bodyLimit: 1024 * 32 }, (request, reply) => {
					if (request.method === 'GET' && !endpoint.meta.allowGet) {
						reply.code(405);
						reply.send();
						return;
					}
		
					this.apiCallService.handleRequest(ep, request, reply);
				});
			}
		}

		fastify.post<{
			Body: {
				username: string;
				password: string;
				host?: string;
				invitationCode?: string;
				emailAddress?: string;
				'hcaptcha-response'?: string;
				'g-recaptcha-response'?: string;
				'turnstile-response'?: string;
			}
		}>('/signup', (request, reply) => this.signupApiService.signup(request, reply));

		fastify.post<{
			Body: {
				username: string;
				password: string;
				token?: string;
				signature?: string;
				authenticatorData?: string;
				clientDataJSON?: string;
				credentialId?: string;
				challengeId?: string;
			};
		}>('/signin', (request, reply) => this.signinApiService.signin(request, reply));

		fastify.post<{ Body: { code: string; } }>('/signup-pending', (request, reply) => this.signupApiService.signupPending(request, reply));

		fastify.get('/v1/instance/peers', async (request, reply) => {
			const instances = await this.instancesRepository.find({
				select: ['host'],
				where: {
					isSuspended: false,
				},
			});

			return instances.map(instance => instance.host);
		});

		fastify.post<{ Params: { session: string; } }>('/miauth/:session/check', async (request, reply) => {
			const token = await this.accessTokensRepository.findOneBy({
				session: request.params.session,
			});

			if (token && token.session != null && !token.fetched) {
				this.accessTokensRepository.update(token.id, {
					fetched: true,
				});

				return {
					ok: true,
					token: token.token,
					user: await this.userEntityService.pack(token.userId, null, { detail: true }),
				};
			} else {
				return {
					ok: false,
				};
			}
		});

		done();
	}
}
