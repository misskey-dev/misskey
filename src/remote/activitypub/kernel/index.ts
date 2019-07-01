import { Object } from '../type';
import { IRemoteUser } from '../../../models/entities/user';
import create from './create';
import performDeleteActivity from './delete';
import performUpdateActivity from './update';
import follow from './follow';
import undo from './undo';
import like from './like';
import announce from './announce';
import accept from './accept';
import reject from './reject';
import add from './add';
import remove from './remove';
import block from './block';
import { apLogger } from '../logger';

const self = async (actor: IRemoteUser, activity: Object): Promise<void> => {
	if (actor.isSuspended) return;

	switch (activity.type) {
	case 'Create':
		await create(actor, activity);
		break;

	case 'Delete':
		await performDeleteActivity(actor, activity);
		break;

	case 'Update':
		await performUpdateActivity(actor, activity);
		break;

	case 'Follow':
		await follow(actor, activity);
		break;

	case 'Accept':
		await accept(actor, activity);
		break;

	case 'Reject':
		await reject(actor, activity);
		break;

	case 'Add':
		await add(actor, activity).catch(err => apLogger.error(err));
		break;

	case 'Remove':
		await remove(actor, activity).catch(err => apLogger.error(err));
		break;

	case 'Announce':
		await announce(actor, activity);
		break;

	case 'Like':
		await like(actor, activity);
		break;

	case 'Undo':
		await undo(actor, activity);
		break;

	case 'Block':
		await block(actor, activity);
		break;

	case 'Collection':
	case 'OrderedCollection':
		// TODO
		break;

	default:
		apLogger.warn(`unknown activity type: ${(activity as any).type}`);
		return;
	}
};

export default self;
