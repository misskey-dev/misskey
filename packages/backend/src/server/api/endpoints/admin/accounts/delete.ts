import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { Users } from '@/models/index.js';
import { doPostSuspend } from '@/services/suspend-user.js';
import { publishUserEvent } from '@/services/stream.js';
import { createDeleteAccountJob } from '@/queue/index.js';

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
				throw new Error('cannot suspend admin');
			}

			if (user.isModerator) {
				throw new Error('cannot suspend moderator');
			}

			if (Users.isLocalUser(user)) {
				// 物理削除する前にDelete activityを送信する
				await doPostSuspend(user).catch(e => {});

				createDeleteAccountJob(user, {
					soft: false,
				});
			} else {
				createDeleteAccountJob(user, {
					soft: true, // リモートユーザーの削除は、完全にDBから物理削除してしまうと再度連合してきてアカウントが復活する可能性があるため、soft指定する
				});
			}

			await Users.update(user.id, {
				isDeleted: true,
			});

			if (Users.isLocalUser(user)) {
				// Terminate streaming
				publishUserEvent(user.id, 'terminate', {});
			}
		});
	}
}
