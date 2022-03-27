import { db } from '@/db/postgre.js';
import { UserList } from '@/models/entities/user-list.js';
import { UserListJoinings } from '../index.js';
import { Packed } from '@/misc/schema.js';

export const UserListRepository = db.getRepository(UserList).extend({
	async pack(
		src: UserList['id'] | UserList,
	): Promise<Packed<'UserList'>> {
		const userList = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		const users = await UserListJoinings.findBy({
			userListId: userList.id,
		});

		return {
			id: userList.id,
			createdAt: userList.createdAt.toISOString(),
			name: userList.name,
			userIds: users.map(x => x.userId),
		};
	},
});
