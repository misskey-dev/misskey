import { EntityRepository, Repository } from 'typeorm';
import { FollowRequest } from '~/models/entities/follow-request';
import { Users } from '~/models';
import { ensure } from '~/prelude/ensure';

@EntityRepository(FollowRequest)
export class FollowRequestRepository extends Repository<FollowRequest> {
	public async pack(
		src: FollowRequest['id'] | FollowRequest,
		me?: any
	) {
		const request = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return {
			id: request.id,
			follower: await Users.pack(request.followerId, me),
			followee: await Users.pack(request.followeeId, me),
		};
	}
}
