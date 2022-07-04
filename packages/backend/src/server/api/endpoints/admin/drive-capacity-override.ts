import define from '../../define.js';
import { Users } from '@/models/index.js';
import { User } from '@/models/entities/user.js';
import { insertModerationLog } from '@/services/insert-moderation-log.js';
export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		overrideMb: { type: 'number', nullable: true },
	},
	required: ['userId', 'overrideMb'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const user = await Users.findOneBy({ id: ps.userId });

	if (user == null) {
		throw new Error('user not found');
	}

	if (!Users.isLocalUser(user)) {
		throw new Error('user is not local user');
	} 

	/*if (user.isAdmin) {
		throw new Error('cannot suspend admin');
	}
	if (user.isModerator) {
		throw new Error('cannot suspend moderator');
	}*/

	await Users.update(user.id, {
		driveCapacityOverrideMb: ps.overrideMb,
	});

	insertModerationLog(me, 'change-drive-capacity-override', {
		targetId: user.id,
	});
});
