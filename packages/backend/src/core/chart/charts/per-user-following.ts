import { Injectable, Inject } from '@nestjs/common';
import { Not, IsNull, DataSource } from 'typeorm';
import { Followings, Users } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import { AppLockService } from '@/core/AppLockService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import Chart from '../core.js';
import { name, schema } from './entities/per-user-following.js';
import type { KVs } from '../core.js';

/**
 * ユーザーごとのフォローに関するチャート
 */
// eslint-disable-next-line import/no-default-export
@Injectable()
export default class PerUserFollowingChart extends Chart<typeof schema> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		private appLockService: AppLockService,
		private userEntityService: UserEntityService,
	) {
		super(db, (k) => appLockService.getChartInsertLock(k), name, schema, true);
	}

	protected async tickMajor(group: string): Promise<Partial<KVs<typeof schema>>> {
		const [
			localFollowingsCount,
			localFollowersCount,
			remoteFollowingsCount,
			remoteFollowersCount,
		] = await Promise.all([
			Followings.countBy({ followerId: group, followeeHost: IsNull() }),
			Followings.countBy({ followeeId: group, followerHost: IsNull() }),
			Followings.countBy({ followerId: group, followeeHost: Not(IsNull()) }),
			Followings.countBy({ followeeId: group, followerHost: Not(IsNull()) }),
		]);

		return {
			'local.followings.total': localFollowingsCount,
			'local.followers.total': localFollowersCount,
			'remote.followings.total': remoteFollowingsCount,
			'remote.followers.total': remoteFollowersCount,
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async update(follower: { id: User['id']; host: User['host']; }, followee: { id: User['id']; host: User['host']; }, isFollow: boolean): Promise<void> {
		const prefixFollower = this.userEntityService.isLocalUser(follower) ? 'local' : 'remote';
		const prefixFollowee = this.userEntityService.isLocalUser(followee) ? 'local' : 'remote';

		this.commit({
			[`${prefixFollower}.followings.total`]: isFollow ? 1 : -1,
			[`${prefixFollower}.followings.inc`]: isFollow ? 1 : 0,
			[`${prefixFollower}.followings.dec`]: isFollow ? 0 : 1,
		}, follower.id);
		this.commit({
			[`${prefixFollowee}.followers.total`]: isFollow ? 1 : -1,
			[`${prefixFollowee}.followers.inc`]: isFollow ? 1 : 0,
			[`${prefixFollowee}.followers.dec`]: isFollow ? 0 : 1,
		}, followee.id);
	}
}
