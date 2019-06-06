import { IActivity, ICreate, IDelete, IUpdate, IFollow, IAccept, IReject, IAdd, IRemove, IAnnounce, ILike, IUndo, IBlock } from '../type';
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

const self = async (actor: IRemoteUser, activity: IActivity): Promise<void> => {
	switch (activity.type) {
	case 'Create':
		await create(actor, activity as ICreate);
		break;

	case 'Delete':
		await performDeleteActivity(actor, activity as IDelete);
		break;

	case 'Update':
		await performUpdateActivity(actor, activity as IUpdate);
		break;

	case 'Follow':
		await follow(actor, activity as IFollow);
		break;

	case 'Accept':
		await accept(actor, activity as IAccept);
		break;

	case 'Reject':
		await reject(actor, activity as IReject);
		break;

	case 'Add':
		await add(actor, activity as IAdd).catch(err => apLogger.error(err));
		break;

	case 'Remove':
		await remove(actor, activity as IRemove).catch(err => apLogger.error(err));
		break;

	case 'Announce':
		await announce(actor, activity as IAnnounce);
		break;

	case 'Like':
		await like(actor, activity as ILike);
		break;

	case 'Undo':
		await undo(actor, activity as IUndo);
		break;

	case 'Block':
		await block(actor, activity as IBlock);
		break;

	default:
		apLogger.warn(`unknown activity type: ${activity.type}`);
		return;
	}
};

export default self;
