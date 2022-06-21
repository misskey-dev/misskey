import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import { renderBlock } from '@/remote/activitypub/renderer/block.js';
import renderUndo from '@/remote/activitypub/renderer/undo.js';
import { deliver } from '@/queue/index.js';
import Logger from '../logger.js';
import { CacheableUser, User } from '@/models/entities/user.js';
import { Blockings, Users } from '@/models/index.js';

const logger = new Logger('blocking/delete');

export default async function(blocker: CacheableUser, blockee: CacheableUser) {
	const blocking = await Blockings.findOneBy({
		blockerId: blocker.id,
		blockeeId: blockee.id,
	});

	if (blocking == null) {
		logger.warn('ブロック解除がリクエストされましたがブロックしていませんでした');
		return;
	}

	// Since we already have the blocker and blockee, we do not need to fetch
	// them in the query above and can just manually insert them here.
	blocking.blocker = blocker;
	blocking.blockee = blockee;

	Blockings.delete(blocking.id);

	// deliver if remote bloking
	if (Users.isLocalUser(blocker) && Users.isRemoteUser(blockee)) {
		const content = renderActivity(renderUndo(renderBlock(blocking), blocker));
		deliver(blocker, content, blockee.inbox);
	}
}
