import config from '../../../../config';
import { IBlock, getApId } from '../../type';
import block from '../../../../services/blocking/create';
import { apLogger } from '../../logger';
import { Users } from '../../../../models';
import { IRemoteUser } from '../../../../models/entities/user';

const logger = apLogger;

export default async (actor: IRemoteUser, activity: IBlock): Promise<void> => {
	const id = getApId(activity.object);

	const uri = getApId(activity);

	logger.info(`Block: ${uri}`);

	if (!id.startsWith(config.url + '/')) {
		return;
	}

	const blockee = await Users.findOne(id.split('/').pop());

	if (blockee == null) {
		throw new Error('blockee not found');
	}

	if (blockee.host != null) {
		throw new Error('ブロックしようとしているユーザーはローカルユーザーではありません');
	}

	block(actor, blockee);
};
