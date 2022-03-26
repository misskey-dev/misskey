import { CacheableRemoteUser } from '@/models/entities/user.js';
import deleteNode from '@/services/note/delete.js';
import { apLogger } from '../../logger.js';
import DbResolver from '../../db-resolver.js';
import { getApLock } from '@/misc/app-lock.js';
import { deleteMessage } from '@/services/messages/delete.js';

const logger = apLogger;

export default async function(actor: CacheableRemoteUser, uri: string): Promise<string> {
	logger.info(`Deleting the Note: ${uri}`);

	const unlock = await getApLock(uri);

	try {
		const dbResolver = new DbResolver();
		const note = await dbResolver.getNoteFromApId(uri);

		if (note == null) {
			const message = await dbResolver.getMessageFromApId(uri);
			if (message == null) return 'message not found';

			if (message.userId !== actor.id) {
				return '投稿を削除しようとしているユーザーは投稿の作成者ではありません';
			}

			await deleteMessage(message);

			return 'ok: message deleted';
		}

		if (note.userId !== actor.id) {
			return '投稿を削除しようとしているユーザーは投稿の作成者ではありません';
		}

		await deleteNode(actor, note);
		return 'ok: note deleted';
	} finally {
		unlock();
	}
}
