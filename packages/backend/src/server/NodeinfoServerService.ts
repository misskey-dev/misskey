import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { NotesRepository, UsersRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import { MetaService } from '@/core/MetaService.js';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { Cache } from '@/misc/cache.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import NotesChart from '@/core/chart/charts/notes.js';
import UsersChart from '@/core/chart/charts/users.js';
import { DEFAULT_POLICIES } from '@/core/RoleService.js';
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
		private notesChart: NotesChart,
		private usersChart: UsersChart,
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

			const notesChart = await this.notesChart.getChart('hour', 1, null);
			const localPosts = notesChart.local.total[0];

			const usersChart = await this.usersChart.getChart('hour', 1, null);
			const total = usersChart.local.total[0];

			const [
				meta,
				//activeHalfyear,
				//activeMonth,
			] = await Promise.all([
				this.metaService.fetch(true),
				// 重い
				//this.usersRepository.count({ where: { host: IsNull(), lastActiveDate: MoreThan(new Date(now - 15552000000)) } }),
				//this.usersRepository.count({ where: { host: IsNull(), lastActiveDate: MoreThan(new Date(now - 2592000000)) } }),
			]);

			const activeHalfyear = null;
			const activeMonth = null;

			const proxyAccount = meta.proxyAccountId ? await this.userEntityService.pack(meta.proxyAccountId).catch(() => null) : null;

			const basePolicies = { ...DEFAULT_POLICIES, ...meta.policies };

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
					tosUrl: meta.termsOfServiceUrl,
					repositoryUrl: meta.repositoryUrl,
					feedbackUrl: meta.feedbackUrl,
					disableRegistration: meta.disableRegistration,
					disableLocalTimeline: !basePolicies.ltlAvailable,
					disableGlobalTimeline: !basePolicies.gtlAvailable,
					emailRequiredForSignup: meta.emailRequiredForSignup,
					enableHcaptcha: meta.enableHcaptcha,
					enableRecaptcha: meta.enableRecaptcha,
					maxNoteTextLength: MAX_NOTE_TEXT_LENGTH,
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
