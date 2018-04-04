import create from './create';
import performDeleteActivity from './delete';
import follow from './follow';
import undo from './undo';
import Resolver from '../resolver';
import { IObject } from '../type';

export default async (parentResolver: Resolver, actor, activity: IObject): Promise<void> => {
	switch (activity.type) {
	case 'Create':
		await create(parentResolver, actor, activity);
		break;

	case 'Delete':
		await performDeleteActivity(parentResolver, actor, activity);
		break;

	case 'Follow':
		await follow(parentResolver, actor, activity);
		break;

	case 'Undo':
		await undo(parentResolver, actor, activity);
		break;

	default:
		console.warn(`unknown activity type: ${activity.type}`);
		return null;
	}
};
