import { Users } from '@/models/index.js';
import { createDeleteAccountJob } from '@/queue/index.js';
import { publishUserEvent } from './stream.js';
import { doPostSuspend } from './suspend-user.js';

export async function deleteAccount(user: {
	id: string;
	host: string | null;
}): Promise<void> {
	// 物理削除する前にDelete activityを送信する
	await doPostSuspend(user).catch(e => {});

	createDeleteAccountJob(user, {
		soft: false,
	});

	await Users.update(user.id, {
		isDeleted: true,
	});

	// Terminate streaming
	publishUserEvent(user.id, 'terminate', {});
}
