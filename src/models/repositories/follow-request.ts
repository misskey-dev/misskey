import { EntityRepository, Repository } from 'typeorm';
import { FollowRequest } from '../entities/follow-request';
import { Users } from '..';

@EntityRepository(FollowRequest)
export class FollowRequestRepository extends Repository<FollowRequest> {
	public async pack(
		request: FollowRequest['id'] | FollowRequest,
		me?: any
	) {
		const _request = typeof request === 'object' ? request : await this.findOne(request);

		return {
			id: _request.id,
			follower: await Users.pack(_request.followerId, me),
			followee: await Users.pack(_request.followeeId, me),
		};
	}
}
