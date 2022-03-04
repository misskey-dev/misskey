import { EntityRepository, Repository } from 'typeorm';
import { UserList } from '@/models/entities/user-list.js';
import { UserListJoinings } from '../index.js';
import { Packed } from '@/misc/schema.js';

@EntityRepository(UserList)
export class UserListRepository extends Repository<UserList> {
	public async pack(
		src: UserList['id'] | UserList,
	): Promise<Packed<'UserList'>> {
		const userList = typeof src === 'object' ? src : await this.findOneOrFail(src);

		const users = await UserListJoinings.find({
			userListId: userList.id,
		});

		return {
			id: userList.id,
			createdAt: userList.createdAt.toISOString(),
			name: userList.name,
			userIds: users.map(x => x.userId),
		};
	}
}
