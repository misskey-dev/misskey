import { IObject } from './type';
import { IRemoteUser } from '@/models/entities/user';
import { performActivity } from './kernel/index';

export default async (actor: IRemoteUser, activity: IObject): Promise<void> => {
	await performActivity(actor, activity);
};
