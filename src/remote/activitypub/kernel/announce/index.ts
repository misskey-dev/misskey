import Resolver from '../../resolver';
import { IRemoteUser } from '@/models/entities/user';
import announceNote from './note';
import { IAnnounce, getApId } from '../../type';
import { apLogger } from '../../logger';

const logger = apLogger;

export default async (actor: IRemoteUser, activity: IAnnounce): Promise<void> => {
	const uri = getApId(activity);

	logger.info(`Announce: ${uri}`);

	const resolver = new Resolver();

	const targetUri = getApId(activity.object);

	announceNote(resolver, actor, activity, targetUri);
};
