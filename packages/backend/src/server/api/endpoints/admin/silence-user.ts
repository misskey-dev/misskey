import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { Users } from '@/models/index.js';
import { insertModerationLog } from '@/services/insert-moderation-log.js';
import { publishInternalEvent } from '@/services/stream.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
    private usersRepository: typeof Users,

		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await Users.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new Error('user not found');
			}

			if (user.isAdmin) {
				throw new Error('cannot silence admin');
			}

			await Users.update(user.id, {
				isSilenced: true,
			});

			publishInternalEvent('userChangeSilencedState', { id: user.id, isSilenced: true });

			insertModerationLog(me, 'silence', {
				targetId: user.id,
			});
		});
	}
}
