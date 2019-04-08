import { EntityRepository, Repository } from 'typeorm';
import { UserList } from '../entities/user-list';

@EntityRepository(UserList)
export class UserListRepository extends Repository<UserList> {
	public async pack(
		src: any,
	) {
		const userList = typeof src === 'object' ? src : await this.findOne(src);

		return {
			id: userList.id,
			name: userList.name
		};
	}
}
