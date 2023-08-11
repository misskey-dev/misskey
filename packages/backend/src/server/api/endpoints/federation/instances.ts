import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { InstancesRepository } from '@/models/index.js';
import { InstanceEntityService } from '@/core/entities/InstanceEntityService.js';
import { MetaService } from '@/core/MetaService.js';
import { DI } from '@/di-symbols.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';

export const meta = {
	tags: ['federation'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 3600,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'FederationInstance',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		host: { type: 'string', nullable: true, description: 'Omit or use `null` to not filter by host.' },
		blocked: { type: 'boolean', nullable: true },
		notResponding: { type: 'boolean', nullable: true },
		suspended: { type: 'boolean', nullable: true },
		federating: { type: 'boolean', nullable: true },
		subscribing: { type: 'boolean', nullable: true },
		publishing: { type: 'boolean', nullable: true },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
		offset: { type: 'integer', default: 0 },
		sort: { type: 'string' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private instanceEntityService: InstanceEntityService,
		private metaService: MetaService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.instancesRepository.createQueryBuilder('instance');

			switch (ps.sort) {
				case '+pubSub': query.orderBy('instance.followingCount', 'DESC').orderBy('instance.followersCount', 'DESC'); break;
				case '-pubSub': query.orderBy('instance.followingCount', 'ASC').orderBy('instance.followersCount', 'ASC'); break;
				case '+notes': query.orderBy('instance.notesCount', 'DESC'); break;
				case '-notes': query.orderBy('instance.notesCount', 'ASC'); break;
				case '+users': query.orderBy('instance.usersCount', 'DESC'); break;
				case '-users': query.orderBy('instance.usersCount', 'ASC'); break;
				case '+following': query.orderBy('instance.followingCount', 'DESC'); break;
				case '-following': query.orderBy('instance.followingCount', 'ASC'); break;
				case '+followers': query.orderBy('instance.followersCount', 'DESC'); break;
				case '-followers': query.orderBy('instance.followersCount', 'ASC'); break;
				case '+firstRetrievedAt': query.orderBy('instance.firstRetrievedAt', 'DESC'); break;
				case '-firstRetrievedAt': query.orderBy('instance.firstRetrievedAt', 'ASC'); break;
				case '+latestRequestReceivedAt': query.orderBy('instance.latestRequestReceivedAt', 'DESC', 'NULLS LAST'); break;
				case '-latestRequestReceivedAt': query.orderBy('instance.latestRequestReceivedAt', 'ASC', 'NULLS FIRST'); break;

				default: query.orderBy('instance.id', 'DESC'); break;
			}

			if (typeof ps.blocked === 'boolean') {
				const meta = await this.metaService.fetch(true);
				if (ps.blocked) {
					query.andWhere(meta.blockedHosts.length === 0 ? '1=0' : 'instance.host IN (:...blocks)', { blocks: meta.blockedHosts });
				} else {
					query.andWhere(meta.blockedHosts.length === 0 ? '1=1' : 'instance.host NOT IN (:...blocks)', { blocks: meta.blockedHosts });
				}
			}

			if (typeof ps.notResponding === 'boolean') {
				if (ps.notResponding) {
					query.andWhere('instance.isNotResponding = TRUE');
				} else {
					query.andWhere('instance.isNotResponding = FALSE');
				}
			}

			if (typeof ps.suspended === 'boolean') {
				if (ps.suspended) {
					query.andWhere('instance.isSuspended = TRUE');
				} else {
					query.andWhere('instance.isSuspended = FALSE');
				}
			}

			if (typeof ps.federating === 'boolean') {
				if (ps.federating) {
					query.andWhere('((instance.followingCount > 0) OR (instance.followersCount > 0))');
				} else {
					query.andWhere('((instance.followingCount = 0) AND (instance.followersCount = 0))');
				}
			}

			if (typeof ps.subscribing === 'boolean') {
				if (ps.subscribing) {
					query.andWhere('instance.followersCount > 0');
				} else {
					query.andWhere('instance.followersCount = 0');
				}
			}

			if (typeof ps.publishing === 'boolean') {
				if (ps.publishing) {
					query.andWhere('instance.followingCount > 0');
				} else {
					query.andWhere('instance.followingCount = 0');
				}
			}

			if (ps.host) {
				query.andWhere('instance.host like :host', { host: '%' + sqlLikeEscape(ps.host.toLowerCase()) + '%' });
			}

			const instances = await query.take(ps.limit).skip(ps.offset).getMany();

			return await this.instanceEntityService.packMany(instances);
		});
	}
}
