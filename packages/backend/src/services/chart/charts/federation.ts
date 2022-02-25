import Chart, { KVs } from '../core.js';
import { Followings } from '@/models/index.js';
import { name, schema } from './entities/federation.js';

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
		const pubsubSubQuery = Followings.createQueryBuilder('f')
			.select('f.followerHost')
			.where('f.followerHost IS NOT NULL');

		const [sub, pub, pubsub] = await Promise.all([
			Followings.createQueryBuilder('following')
				.select('COUNT(DISTINCT following.followeeHost)')
				.where('following.followeeHost IS NOT NULL')
				.getRawOne()
				.then(x => parseInt(x.count, 10)),
			Followings.createQueryBuilder('following')
				.select('COUNT(DISTINCT following.followerHost)')
				.where('following.followerHost IS NOT NULL')
				.getRawOne()
				.then(x => parseInt(x.count, 10)),
			Followings.createQueryBuilder('following')
				.select('COUNT(DISTINCT following.followeeHost)')
				.where('following.followeeHost IS NOT NULL')
				.andWhere(`following.followerHost IN (${ pubsubSubQuery.getQuery() })`)
				.setParameters(pubsubSubQuery.getParameters())
				.getRawOne()
				.then(x => parseInt(x.count, 10)),
		]);

		return {
			'sub': sub,
			'pub': pub,
			'pubsub': pubsub,
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
