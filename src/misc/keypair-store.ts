import { UserKeypairs } from '../models';
import { User } from '../models/entities/user';
import { UserKeypair } from '../models/entities/user-keypair';
import { Cache } from './cache';

const cache = new Cache<UserKeypair>(Infinity);

export async function getUserKeypair(userId: User['id']): Promise<UserKeypair> {
	return await cache.fetch(userId, async () => await UserKeypairs.findOneOrFail(userId));
}
