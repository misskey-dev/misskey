import { EntityRepository, Repository } from 'typeorm';
import { UserGroupInvite } from '../entities/user-group-invite';
import { UserGroups } from '..';
import { ensure } from '../../prelude/ensure';

@EntityRepository(UserGroupInvite)
export class UserGroupInviteRepository extends Repository<UserGroupInvite> {
	public async pack(
		src: UserGroupInvite['id'] | UserGroupInvite,
	) {
		const invite = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return {
			id: invite.id,
			group: await UserGroups.pack(invite.userGroup || invite.userGroupId),
		};
	}

	public packMany(
		invites: any[],
	) {
		return Promise.all(invites.map(x => this.pack(x)));
	}
}
