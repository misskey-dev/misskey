import { IObject } from './type.js';
import { IRemoteUser } from '@/models/entities/user.js';
import { performActivity } from './kernel/index.js';

export default async (actor: IRemoteUser, activity: IObject): Promise<void> => {
	await performActivity(actor, activity);
};
