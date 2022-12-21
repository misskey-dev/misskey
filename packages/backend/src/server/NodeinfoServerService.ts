import { Inject, Injectable } from '@nestjs/common';
import { IsNull, MoreThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { NotesRepository, UsersRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import { MetaService } from '@/core/MetaService.js';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { Cache } from '@/misc/cache.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

const nodeinfo2_1path = '/nodeinfo/2.1';
const nodeinfo2_0path = '/nodeinfo/2.0';

@Injectable()
export class NodeinfoServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private userEntityService: UserEntityService,
		private metaService: MetaService,
	) {
		//this.createServer = this.createServer.bind(this);
	}

	@bindThis
	public getLinks() {
		return [/* (awaiting release) {
			rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
			href: config.url + nodeinfo2_1path
		}, */{
				rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
				href: this.config.url + nodeinfo2_0path,
			}];
	}

	@bindThis
	public createServer(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		const nodeinfo2 = async () => {
			const now = Date.now();
			const [
				meta,
				total,
				activeHalfyear,
				activeMonth,
				localPosts,
			] = await Promise.all([
				this.metaService.fetch(true),
				this.usersRepository.count({ where: { host: IsNull() } }),
				this.usersRepository.count({ where: { host: IsNull(), lastActiveDate: MoreThan(new Date(now - 15552000000)) } }),
				this.usersRepository.count({ where: { host: IsNull(), lastActiveDate: MoreThan(new Date(now - 2592000000)) } }),
				this.notesRepository.count({ where: { userHost: IsNull() } }),
			]);

			const proxyAccount = meta.proxyAccountId ? await this.userEntityService.pack(meta.proxyAccountId).catch(() => null) : null;

			return {
				software: {
					name: 'misskey',
					version: this.config.version,
					repository: meta.repositoryUrl,
				},
				protocols: ['activitypub'],
				services: {
					inbound: [] as string[],
					outbound: ['atom1.0', 'rss2.0'],
				},
				openRegistrations: !meta.disableRegistration,
				usage: {
					users: { total, activeHalfyear, activeMonth },
					localPosts,
					localComments: 0,
				},
				metadata: {
					nodeName: meta.name,
					nodeDescription: meta.description,
					maintainer: {
						name: meta.maintainerName,
						email: meta.maintainerEmail,
					},
					langs: meta.langs,
					tosUrl: meta.ToSUrl,
					repositoryUrl: meta.repositoryUrl,
					feedbackUrl: meta.feedbackUrl,
					disableRegistration: meta.disableRegistration,
					disableLocalTimeline: meta.disableLocalTimeline,
					disableGlobalTimeline: meta.disableGlobalTimeline,
					emailRequiredForSignup: meta.emailRequiredForSignup,
					enableHcaptcha: meta.enableHcaptcha,
					enableRecaptcha: meta.enableRecaptcha,
					maxNoteTextLength: MAX_NOTE_TEXT_LENGTH,
					enableTwitterIntegration: meta.enableTwitterIntegration,
					enableGithubIntegration: meta.enableGithubIntegration,
					enableDiscordIntegration: meta.enableDiscordIntegration,
					enableEmail: meta.enableEmail,
					enableServiceWorker: meta.enableServiceWorker,
					proxyAccountName: proxyAccount ? proxyAccount.username : null,
					themeColor: meta.themeColor ?? '#86b300',
				},
			};
		};

		const cache = new Cache<Awaited<ReturnType<typeof nodeinfo2>>>(1000 * 60 * 10);

		fastify.get(nodeinfo2_1path, async (request, reply) => {
			const base = await cache.fetch(null, () => nodeinfo2());

			reply.header('Cache-Control', 'public, max-age=600');
			return { version: '2.1', ...base };
		});

		fastify.get(nodeinfo2_0path, async (request, reply) => {
			const base = await cache.fetch(null, () => nodeinfo2());

			delete (base as any).software.repository;

			reply.header('Cache-Control', 'public, max-age=600');
			return { version: '2.0', ...base };
		});

		done();
	}
}
