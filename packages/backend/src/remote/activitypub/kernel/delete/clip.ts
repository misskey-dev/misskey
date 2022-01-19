import { IRemoteUser } from '@/models/entities/user';
import { apLogger } from '../../logger';
import DbResolver from '../../db-resolver';
import { getApLock } from '@/misc/app-lock';
import { Clips } from '@/models';

const logger = apLogger;

export default async function(actor: IRemoteUser, uri: string): Promise<string> {
	logger.info(`Deleting the Clip: ${uri}`);

	const unlock = await getApLock(uri);

	try {
		const dbResolver = new DbResolver();
		const clip = await dbResolver.getClipFromApId(uri);

		if (clip == null) {
			return 'clip not found';
		}

		if (clip.userId !== actor.id) {
			return 'Clipを削除しようとしているユーザーは投稿の作成者ではありません';
		}

		await Clips.delete({
			id: clip.id,
			userId: clip.userId,
		});
		return 'ok: clip deleted';

	} finally {
		unlock();
	}
}
