import { UserKeypairs } from '@/models/index.js';
import { User } from '@/models/entities/user.js';
import { UserKeypair } from '@/models/entities/user-keypair.js';
import { Cache } from './cache.js';

const cache = new Cache<UserKeypair>(Infinity);

export async function getUserKeypair(userId: User['id']): Promise<UserKeypair> {
	return await cache.fetch(userId, () => UserKeypairs.findOneByOrFail({ userId: userId }));
}
