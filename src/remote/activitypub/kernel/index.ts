import { IObject, isCreate, isDelete, isUpdate, isRead, isFollow, isAccept, isReject, isAdd, isRemove, isAnnounce, isLike, isUndo, isBlock, isCollectionOrOrderedCollection, isCollection, isFlag } from '../type';
import { IRemoteUser } from '@/models/entities/user';
import create from './create/index';
import performDeleteActivity from './delete/index';
import performUpdateActivity from './update/index';
import { performReadActivity } from './read';
import follow from './follow';
import undo from './undo/index';
import like from './like';
import announce from './announce/index';
import accept from './accept/index';
import reject from './reject/index';
import add from './add/index';
import remove from './remove/index';
import block from './block/index';
import flag from './flag/index';
import { apLogger } from '../logger';
import Resolver from '../resolver';
import { toArray } from '@/prelude/array';

export async function performActivity(actor: IRemoteUser, activity: IObject) {
	if (isCollectionOrOrderedCollection(activity)) {
		const resolver = new Resolver();
		for (const item of toArray(isCollection(activity) ? activity.items : activity.orderedItems)) {
			const act = await resolver.resolve(item);
			try {
				await performOneActivity(actor, act);
			} catch (e) {
				apLogger.error(e);
			}
		}
	} else {
		await performOneActivity(actor, activity);
	}
}

async function performOneActivity(actor: IRemoteUser, activity: IObject): Promise<void> {
	if (actor.isSuspended) return;

	if (isCreate(activity)) {
		await create(actor, activity);
	} else if (isDelete(activity)) {
		await performDeleteActivity(actor, activity);
	} else if (isUpdate(activity)) {
		await performUpdateActivity(actor, activity);
	} else if (isRead(activity)) {
		await performReadActivity(actor, activity);
	} else if (isFollow(activity)) {
		await follow(actor, activity);
	} else if (isAccept(activity)) {
		await accept(actor, activity);
	} else if (isReject(activity)) {
		await reject(actor, activity);
	} else if (isAdd(activity)) {
		await add(actor, activity).catch(err => apLogger.error(err));
	} else if (isRemove(activity)) {
		await remove(actor, activity).catch(err => apLogger.error(err));
	} else if (isAnnounce(activity)) {
		await announce(actor, activity);
	} else if (isLike(activity)) {
		await like(actor, activity);
	} else if (isUndo(activity)) {
		await undo(actor, activity);
	} else if (isBlock(activity)) {
		await block(actor, activity);
	} else if (isFlag(activity)) {
		await flag(actor, activity);
	} else {
		apLogger.warn(`unrecognized activity type: ${(activity as any).type}`);
	}
}
