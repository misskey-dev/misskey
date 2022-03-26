import { IBlock } from '../../type.js';
import block from '@/services/blocking/create.js';
import { CacheableRemoteUser } from '@/models/entities/user.js';
import DbResolver from '../../db-resolver.js';
import { Users } from '@/models/index.js';

export default async (actor: CacheableRemoteUser, activity: IBlock): Promise<string> => {
	// ※ activity.objectにブロック対象があり、それは存在するローカルユーザーのはず

	const dbResolver = new DbResolver();
	const blockee = await dbResolver.getUserFromApId(activity.object);

	if (blockee == null) {
		return `skip: blockee not found`;
	}

	if (blockee.host != null) {
		return `skip: ブロックしようとしているユーザーはローカルユーザーではありません`;
	}

	await block(await Users.findOneByOrFail({ id: actor.id }), await Users.findOneByOrFail({ id: blockee.id }));
	return `ok`;
};
