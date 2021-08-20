import { IRemoteUser } from '@/models/entities/user';
import deleteNode from '@/services/note/delete';
import { apLogger } from '../../logger';
import DbResolver from '../../db-resolver';
import { getApLock } from '@/misc/app-lock';
import { deleteMessage } from '@/services/messages/delete';

const logger = apLogger;

export default async function(actor: IRemoteUser, uri: string): Promise<string> {
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
