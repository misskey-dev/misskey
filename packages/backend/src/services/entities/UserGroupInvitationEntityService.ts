import { Inject, Injectable } from '@nestjs/common';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { UserGroupInvitations } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/blocking.js';
import type { User } from '@/models/entities/user.js';
import type { UserGroupInvitation } from '@/models/entities/user-group-invitation.js';
import { UserEntityService } from './UserEntityService.js';
import { UserGroupEntityService } from './UserGroupEntityService.js';

@Injectable()
export class UserGroupInvitationEntityService {
	constructor(
		@Inject('userGroupInvitationsRepository')
		private userGroupInvitationsRepository: typeof UserGroupInvitations,

		private userGroupEntityService: UserGroupEntityService,
	) {
	}

	public async pack(
		src: UserGroupInvitation['id'] | UserGroupInvitation,
	) {
		const invitation = typeof src === 'object' ? src : await this.userGroupInvitationsRepository.findOneByOrFail({ id: src });

		return {
			id: invitation.id,
			group: await this.userGroupEntityService.pack(invitation.userGroup || invitation.userGroupId),
		};
	}

	public packMany(
		invitations: any[],
	) {
		return Promise.all(invitations.map(x => this.pack(x)));
	}
}

