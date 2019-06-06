import { ActivityStreamsObject } from './type';
import { IRemoteUser } from '../../models/entities/user';
import kernel from './kernel';

export default async (actor: IRemoteUser, activity: ActivityStreamsObject): Promise<void> => {
	await kernel(actor, activity);
};
