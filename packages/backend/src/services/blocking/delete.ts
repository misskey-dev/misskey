import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderBlock from '@/remote/activitypub/renderer/block.js';
import renderUndo from '@/remote/activitypub/renderer/undo.js';
import { deliver } from '@/queue/index.js';
import Logger from '../logger.js';
import { User } from '@/models/entities/user.js';
import { Blockings, Users } from '@/models/index.js';

const logger = new Logger('blocking/delete');

export default async function(blocker: User, blockee: User) {
	const blocking = await Blockings.findOne({
		blockerId: blocker.id,
		blockeeId: blockee.id,
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
