import { EntityRepository, Repository } from 'typeorm';
import { UserList } from '../entities/user-list';
import { ensure } from '../../prelude/ensure';

@EntityRepository(UserList)
export class UserListRepository extends Repository<UserList> {
	public async pack(
		src: UserList['id'] | UserList,
	) {
		const userList = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return {
			id: userList.id,
			name: userList.name
		};
	}
}
