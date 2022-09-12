import { IObject } from './type.js';
import { CacheableRemoteUser } from '@/models/entities/user.js';
import { performActivity } from './kernel/index.js';
import { updatePerson } from './models/person.js';

export default async (actor: CacheableRemoteUser, activity: IObject): Promise<void> => {
	await performActivity(actor, activity);

	// ついでにリモートユーザーの情報が古かったら更新しておく
	if (actor.uri) {
		if (actor.lastFetchedAt == null || Date.now() - actor.lastFetchedAt.getTime() > 1000 * 60 * 60 * 24) {
			setImmediate(() => {
				updatePerson(actor.uri!);
			});
		}
	}
};
