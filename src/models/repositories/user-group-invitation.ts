import { EntityRepository, Repository } from 'typeorm';
import { UserGroupInvitation } from '../entities/user-group-invitation';
import { UserGroups } from '..';
import { ensure } from '../../prelude/ensure';

@EntityRepository(UserGroupInvitation)
export class UserGroupInvitationRepository extends Repository<UserGroupInvitation> {
	public async pack(
		src: UserGroupInvitation['id'] | UserGroupInvitation,
	) {
		const invitation = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return {
			id: invitation.id,
			group: await UserGroups.pack(invitation.userGroup || invitation.userGroupId),
		};
	}

	public packMany(
		invitations: any[],
	) {
		return Promise.all(invitations.map(x => this.pack(x)));
	}
}
