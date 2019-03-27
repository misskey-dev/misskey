import { EntityRepository, Repository } from 'typeorm';
import { FollowRequest } from '../entities/follow-request';
import { Users } from '..';

@EntityRepository(FollowRequest)
export class FollowRequestRepository extends Repository<FollowRequest> {
	private async cloneOrFetch(x: FollowRequest['id'] | FollowRequest): Promise<FollowRequest> {
		if (typeof x === 'object') {
			return JSON.parse(JSON.stringify(x));
		} else {
			return await this.findOne(x);
		}
	}

	public async pack(
		request: any,
		me?: any
	) {
		const _request = await this.cloneOrFetch(request);

		return {
			id: _request.id,
			follower: await Users.pack(_request.followerId, me),
			followee: await Users.pack(_request.followeeId, me),
		};
	}
}
