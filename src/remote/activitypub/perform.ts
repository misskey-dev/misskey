import { Object } from './type';
import { IRemoteUser } from '../../models/user';
import kernel from './kernel';

export default async (actor: IRemoteUser, activity: Object): Promise<void> => {
	await kernel(actor, activity);
};
