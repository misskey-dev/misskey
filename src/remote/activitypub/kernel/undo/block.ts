import config from '../../../../config';
import { IBlock } from '../../type';
import unblock from '../../../../services/blocking/delete';
import { apLogger } from '../../logger';
import { IRemoteUser } from '../../../../models/entities/user';
import { Users } from '../../../../models';

const logger = apLogger;

export default async (actor: IRemoteUser, activity: IBlock): Promise<void> => {
	const id = typeof activity.object === 'string' ? activity.object : activity.object.id;
	if (id == null) throw new Error('missing id');

	const uri = activity.id || activity;

	logger.info(`UnBlock: ${uri}`);

	if (!id.startsWith(config.url + '/')) {
		return;
	}

	const blockee = await Users.findOne(id.split('/').pop());

	if (blockee == null) {
		throw new Error('blockee not found');
	}

	if (blockee.host != null) {
		throw new Error('ブロック解除しようとしているユーザーはローカルユーザーではありません');
	}

	unblock(actor, blockee);
};
