import { EntityRepository, Repository } from 'typeorm';
import { UserGroupInvitation } from '@/models/entities/user-group-invitation.js';
import { UserGroups } from '../index.js';

@EntityRepository(UserGroupInvitation)
export class UserGroupInvitationRepository extends Repository<UserGroupInvitation> {
	public async pack(
		src: UserGroupInvitation['id'] | UserGroupInvitation,
	) {
		const invitation = typeof src === 'object' ? src : await this.findOneOrFail(src);

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
