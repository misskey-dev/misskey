import create from './create';
import performDeleteActivity from './delete';
import follow from './follow';
import undo from './undo';
import { IObject } from '../type';
import { IRemoteUser } from '../../../models/user';

const self = async (actor: IRemoteUser, activity: IObject): Promise<void> => {
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

	case 'Undo':
		await undo(actor, activity);
		break;

	case 'Collection':
	case 'OrderedCollection':
		// TODO
		break;

	default:
		console.warn(`unknown activity type: ${activity.type}`);
		return null;
	}
};

export default self;
