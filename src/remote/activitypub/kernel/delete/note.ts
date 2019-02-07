import Note from '../../../../models/note';
import { IRemoteUser } from '../../../../models/user';
import deleteNode from '../../../../services/note/delete';
import { apLogger } from '../../logger';

const logger = apLogger;

export default async function(actor: IRemoteUser, uri: string): Promise<void> {
	logger.info(`Deleting the Note: ${uri}`);

	const note = await Note.findOne({ uri });

	if (note == null) {
		throw new Error('note not found');
	}

	if (!note.userId.equals(actor._id)) {
		throw new Error('投稿を削除しようとしているユーザーは投稿の作成者ではありません');
	}

	await deleteNode(actor, note);
}
