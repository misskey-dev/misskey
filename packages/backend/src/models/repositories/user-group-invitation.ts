import { db } from '@/db/postgre.js';
import { UserGroupInvitation } from '@/models/entities/user-group-invitation.js';
import { UserGroups } from '../index.js';

export const UserGroupInvitationRepository = db.getRepository(UserGroupInvitation).extend({
	async pack(
		src: UserGroupInvitation['id'] | UserGroupInvitation,
	) {
		const invitation = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		return {
			id: invitation.id,
			group: await UserGroups.pack(invitation.userGroup || invitation.userGroupId),
		};
	},

	packMany(
		invitations: any[],
	) {
		return Promise.all(invitations.map(x => this.pack(x)));
	},
});
