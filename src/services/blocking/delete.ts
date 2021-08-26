import { renderActivity } from '@/remote/activitypub/renderer/index';
import renderBlock from '@/remote/activitypub/renderer/block';
import renderUndo from '@/remote/activitypub/renderer/undo';
import { deliver } from '@/queue/index';
import Logger from '../logger';
import { User } from '@/models/entities/user';
import { Blockings, Users } from '@/models/index';

const logger = new Logger('blocking/delete');

export default async function(blocker: User, blockee: User) {
	const blocking = await Blockings.findOne({
		blockerId: blocker.id,
		blockeeId: blockee.id
	});

	if (blocking == null) {
		logger.warn('ブロック解除がリクエストされましたがブロックしていませんでした');
		return;
	}

	Blockings.delete(blocking.id);

	// deliver if remote bloking
	if (Users.isLocalUser(blocker) && Users.isRemoteUser(blockee)) {
		const content = renderActivity(renderUndo(renderBlock(blocker, blockee), blocker));
		deliver(blocker, content, blockee.inbox);
	}
}
