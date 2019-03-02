import { isLocalUser, isRemoteUser, IUser } from '../../models/user';
import Blocking from '../../models/blocking';
import { renderActivity } from '../../remote/activitypub/renderer';
import renderBlock from '../../remote/activitypub/renderer/block';
import renderUndo from '../../remote/activitypub/renderer/undo';
import { deliver } from '../../queue';
import Logger from '../logger';

const logger = new Logger('blocking/delete');

export default async function(blocker: IUser, blockee: IUser) {
	const blocking = await Blocking.findOne({
		blockerId: blocker._id,
		blockeeId: blockee._id
	});

	if (blocking == null) {
		logger.warn('ブロック解除がリクエストされましたがブロックしていませんでした');
		return;
	}

	Blocking.remove({
		_id: blocking._id
	});

	// deliver if remote bloking
	if (isLocalUser(blocker) && isRemoteUser(blockee)) {
		const content = renderActivity(renderUndo(renderBlock(blocker, blockee), blocker));
		deliver(blocker, content, blockee.inbox);
	}
}
