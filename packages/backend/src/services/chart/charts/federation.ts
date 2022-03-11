import Chart, { KVs } from '../core.js';
import { Followings, Instances } from '@/models/index.js';
import { name, schema } from './entities/federation.js';
import { fetchMeta } from '@/misc/fetch-meta.js';

/**
 * フェデレーションに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class FederationChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		const meta = await fetchMeta();

		const suspendedInstancesQuery = Instances.createQueryBuilder('instance')
			.select('instance.host')
			.where('instance.isSuspended = true');

		const pubsubSubQuery = Followings.createQueryBuilder('f')
			.select('f.followerHost')
			.where('f.followerHost IS NOT NULL');

		const subInstancesQuery = Followings.createQueryBuilder('f')
			.select('f.followeeHost')
			.where('f.followeeHost IS NOT NULL');

		const pubInstancesQuery = Followings.createQueryBuilder('f')
			.select('f.followerHost')
			.where('f.followerHost IS NOT NULL');

		const [sub, pub, pubsub, subActive, pubActive] = await Promise.all([
			Followings.createQueryBuilder('following')
				.select('COUNT(DISTINCT following.followeeHost)')
				.where('following.followeeHost IS NOT NULL')
				.andWhere(meta.blockedHosts.length === 0 ? '1=1' : `following.followeeHost NOT IN (:...blocked)`, { blocked: meta.blockedHosts })
				.andWhere(`following.followeeHost NOT IN (${ suspendedInstancesQuery.getQuery() })`)
				.getRawOne()
				.then(x => parseInt(x.count, 10)),
			Followings.createQueryBuilder('following')
				.select('COUNT(DISTINCT following.followerHost)')
				.where('following.followerHost IS NOT NULL')
				.andWhere(meta.blockedHosts.length === 0 ? '1=1' : `following.followerHost NOT IN (:...blocked)`, { blocked: meta.blockedHosts })
				.andWhere(`following.followerHost NOT IN (${ suspendedInstancesQuery.getQuery() })`)
				.getRawOne()
				.then(x => parseInt(x.count, 10)),
			Followings.createQueryBuilder('following')
				.select('COUNT(DISTINCT following.followeeHost)')
				.where('following.followeeHost IS NOT NULL')
				.andWhere(meta.blockedHosts.length === 0 ? '1=1' : `following.followeeHost NOT IN (:...blocked)`, { blocked: meta.blockedHosts })
				.andWhere(`following.followeeHost NOT IN (${ suspendedInstancesQuery.getQuery() })`)
				.andWhere(`following.followeeHost IN (${ pubsubSubQuery.getQuery() })`)
				.setParameters(pubsubSubQuery.getParameters())
				.getRawOne()
				.then(x => parseInt(x.count, 10)),
			Instances.createQueryBuilder('instance')
				.select('COUNT(instance.id)')
				.where(`instance.host IN (${ subInstancesQuery.getQuery() })`)
				.andWhere(meta.blockedHosts.length === 0 ? '1=1' : `instance.host NOT IN (:...blocked)`, { blocked: meta.blockedHosts })
				.andWhere(`instance.isSuspended = false`)
				.andWhere(`instance.lastCommunicatedAt > :gt`, { gt: new Date(Date.now() - (1000 * 60 * 60 * 24 * 30)) })
				.getRawOne()
				.then(x => parseInt(x.count, 10)),
			Instances.createQueryBuilder('instance')
				.select('COUNT(instance.id)')
				.where(`instance.host IN (${ pubInstancesQuery.getQuery() })`)
				.andWhere(meta.blockedHosts.length === 0 ? '1=1' : `instance.host NOT IN (:...blocked)`, { blocked: meta.blockedHosts })
				.andWhere(`instance.isSuspended = false`)
				.andWhere(`instance.lastCommunicatedAt > :gt`, { gt: new Date(Date.now() - (1000 * 60 * 60 * 24 * 30)) })
				.getRawOne()
				.then(x => parseInt(x.count, 10)),
		]);

		return {
			'sub': sub,
			'pub': pub,
			'pubsub': pubsub,
			'subActive': subActive,
			'pubActive': pubActive,
		};
	}

	public async deliverd(host: string, succeeded: boolean): Promise<void> {
		await this.commit(succeeded ? {
			'deliveredInstances': [host],
		} : {
			'stalled': [host],
		});
	}

	public async inbox(host: string): Promise<void> {
		await this.commit({
			'inboxInstances': [host],
		});
	}
}
