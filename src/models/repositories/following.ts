import { EntityRepository, Repository } from 'typeorm';
import { Users } from '..';
import rap from '@prezzemolo/rap';
import { Following } from '../entities/following';

@EntityRepository(Following)
export class FollowingRepository extends Repository<Following> {
	public packMany(
		followings: any[],
		me?: any,
		opts?: {
			populateFollowee?: boolean;
			populateFollower?: boolean;
		}
	) {
		return Promise.all(followings.map(x => this.pack(x, me, opts)));
	}

	public async pack(
		src: Following['id'] | Following,
		me?: any,
		opts?: {
			populateFollowee?: boolean;
			populateFollower?: boolean;
		}
	) {
		const following = typeof src === 'object' ? src : await this.findOne(src);

		if (opts == null) opts = {};

		return await rap({
			id: following.id,
			createdAt: following.createdAt,
			followeeId: following.followeeId,
			followerId: following.followerId,
			followee: opts.populateFollowee ? Users.pack(following.followee || following.followeeId, me, {
				detail: true
			}) : null,
			follower: opts.populateFollower ? Users.pack(following.follower || following.followerId, me, {
				detail: true
			}) : null,
		});
	}
}
