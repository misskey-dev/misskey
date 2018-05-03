import { Object } from '../type';
import { IRemoteUser } from '../../../models/user';
import create from './create';
import performDeleteActivity from './delete';
import follow from './follow';
import undo from './undo';
import like from './like';
import announce from './announce';

const self = async (actor: IRemoteUser, activity: Object): Promise<void> => {
	switch (activity.type) {
	case 'Create':
		await create(actor, activity);
		break;

	case 'Delete':
		await performDeleteActivity(actor, activity);
		break;

	case 'Follow':
		await follow(actor, activity);
		break;

	case 'Accept':
		// noop
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

	case 'Collection':
	case 'OrderedCollection':
		// TODO
		break;

	default:
		console.warn(`unknown activity type: ${(activity as any).type}`);
		return null;
	}
};

export default self;
